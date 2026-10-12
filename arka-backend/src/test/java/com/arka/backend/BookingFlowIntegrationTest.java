package com.arka.backend;

import com.arka.backend.dto.BookingRequest;
import com.arka.backend.entity.Layout;
import com.arka.backend.exceptions.BookingConflictException;
import com.arka.backend.service.BookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Проверка на настоящем PostgreSQL: миграции, exclusion constraint, гонка броней, права доступа.
 * Без Docker тест пропускается.
 */
@SpringBootTest(properties = {
        "jwt.secret=test-secret-test-secret-test-secret-test-secret",
        "spring.cache.type=simple",
        "admin.email=admin@arka123.by",
        "admin.password=admin-password",
        "app.mail.admin-to=owner@arka123.by"
})
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class BookingFlowIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired
    private MockMvc mvc;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private JdbcTemplate jdbc;

    /** Настоящий SMTP в тестах не нужен: перехватываем готовые письма */
    @MockitoBean
    private JavaMailSender mailSender;

    private static final AtomicInteger DAY = new AtomicInteger(3);

    /** Каждый тест бронирует свой день — тесты не мешают друг другу */
    private LocalDate freshDay() {
        return LocalDate.now(ZoneId.of("Europe/Minsk")).plusDays(DAY.getAndIncrement());
    }

    private String bookingJson(LocalDate date, String from, String to) {
        return bookingJson(date, from, to, "anna@example.com");
    }

    private String bookingJson(LocalDate date, String from, String to, String email) {
        return """
                {"date":"%s","startTime":"%s","endTime":"%s","layout":"LECTURE","guests":20,
                 "services":["PROJECTOR"],"contactName":"Анна","contactPhone":"+375 29 123-45-67","contactEmail":"%s"}
                """.formatted(date, from, to, email);
    }

    private MvcResult book(LocalDate date, String from, String to, int expectedStatus) throws Exception {
        return bookAs("anna@example.com", date, from, to, expectedStatus);
    }

    private MvcResult bookAs(String email, LocalDate date, String from, String to, int expectedStatus) throws Exception {
        return mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(bookingJson(date, from, to, email)))
                .andExpect(status().is(expectedStatus))
                .andReturn();
    }

    private static String field(MvcResult r, String name) throws Exception {
        Matcher m = Pattern.compile("\"" + name + "\":\"([^\"]+)\"").matcher(r.getResponse().getContentAsString());
        assertTrue(m.find(), "в ответе нет поля " + name);
        return m.group(1);
    }

    @BeforeEach
    void mail() {
        when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage((Session) null));
    }

    /** Письма уходят асинхронно — ждём конкретное письмо по получателю и теме, а не считаем все отправки */
    private MimeMessage awaitMail(String to, String subjectPrefix) throws Exception {
        long deadline = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < deadline) {
            for (var inv : mockingDetails(mailSender).getInvocations()) {
                if (inv.getMethod().getName().equals("send") && inv.getArgument(0) instanceof MimeMessage m
                        && recipient(m).equals(to) && m.getSubject() != null && m.getSubject().startsWith(subjectPrefix)) {
                    return m;
                }
            }
            Thread.sleep(50);
        }
        throw new AssertionError("нет письма «" + subjectPrefix + "…» для " + to);
    }

    private static String uniqueEmail() {
        return "guest" + System.nanoTime() + "@example.com";
    }

    @Test
    void createdBooking_sendsBrandedMailToGuestAndAdmin() throws Exception {
        String email = uniqueEmail();
        String code = field(bookAs(email, freshDay(), "15:00", "17:00", 201), "code");

        MimeMessage guest = awaitMail(email, "Заявка принята");
        String html = html(guest);
        assertTrue(html.contains(code), "в письме есть код брони");
        assertTrue(html.contains("/booking/" + code), "ссылка на страницу брони");
        assertTrue(html.contains("15:00–17:00"));
        assertTrue(html.contains("Встречаемся напротив Библиотеки"));

        MimeMessage admin = awaitMail("owner@arka123.by", "Новая бронь");
        assertTrue(html(admin).contains(email), "администратор видит контакты гостя");
    }

    @Test
    void cancelByGuest_sendsCancellationMail() throws Exception {
        String email = uniqueEmail();
        String code = field(bookAs(email, freshDay(), "19:00", "21:00", 201), "code");

        mvc.perform(post("/api/bookings/" + code + "/cancel")).andExpect(status().isOk());

        assertTrue(html(awaitMail(email, "Бронь отменена")).contains("Вы отменили бронь"));
    }

    @Test
    void mailFailure_doesNotBreakBooking() throws Exception {
        String email = uniqueEmail();
        doThrow(new org.springframework.mail.MailSendException("smtp down"))
                .when(mailSender).send(argThat((MimeMessage m) -> recipient(m).equals(email)));
        bookAs(email, freshDay(), "10:00", "12:00", 201);
    }

    private static String recipient(MimeMessage m) {
        try {
            return m.getRecipients(Message.RecipientType.TO)[0].toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String html(MimeMessage m) throws Exception {
        return collect(m.getContent());
    }

    private static String collect(Object content) throws Exception {
        if (content instanceof String s) return s;
        if (content instanceof jakarta.mail.Multipart mp) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < mp.getCount(); i++) sb.append(collect(mp.getBodyPart(i).getContent()));
            return sb.toString();
        }
        return "";
    }

    @Test
    void catalog_isPublic() throws Exception {
        mvc.perform(get("/api/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hallName").value("АРКА 123"))
                .andExpect(jsonPath("$.tariffs.length()").value(3))
                .andExpect(jsonPath("$.layouts.length()").value(4));
    }

    @Test
    void booking_overlapRejected_adjacentAllowed() throws Exception {
        LocalDate day = freshDay();
        MvcResult created = book(day, "10:00", "14:00", 201);
        // 4 часа → «Полдня», проектор входит в тариф
        assertTrue(created.getResponse().getContentAsString().contains("\"totalPrice\":250"));

        book(day, "10:00", "14:00", 409);   // тот же слот
        book(day, "13:00", "15:00", 409);   // частичное пересечение
        book(day, "08:00", "11:00", 409);   // накрывает начало
        book(day, "14:00", "16:00", 201);   // сразу после — можно

        mvc.perform(get("/api/availability").param("date", day.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots[2].start").value("10:00:00"))
                .andExpect(jsonPath("$.slots[2].free").value(false))
                .andExpect(jsonPath("$.slots[7].start").value("15:00:00"))
                .andExpect(jsonPath("$.slots[7].free").value(false))   // 14–16 занят до 16:00
                .andExpect(jsonPath("$.slots[8].free").value(true));   // с 16:00 свободно
    }

    @Test
    void cancelledBooking_freesSlot() throws Exception {
        LocalDate day = freshDay();
        String code = field(book(day, "18:00", "21:00", 201), "code");

        mvc.perform(post("/api/bookings/" + code + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // constraint учитывает только активные брони — слот снова свободен
        book(day, "18:00", "21:00", 201);
    }

    @Test
    void database_rejectsOverlap_evenBypassingService() {
        LocalDate day = freshDay();
        String insert = "INSERT INTO bookings(public_code, hall_id, tariff_id, layout, guests, date, start_time, end_time, status, contact_name, contact_phone, total_price) " +
                "VALUES (gen_random_uuid(), 1, 1, 'LECTURE', 10, ?, ?, ?, 'PENDING', 'Тест', '+375290000000', 140)";
        jdbc.update(insert, day, LocalTime.of(10, 0), LocalTime.of(12, 0));
        Exception e = assertThrows(Exception.class, () -> jdbc.update(insert, day, LocalTime.of(11, 0), LocalTime.of(13, 0)));
        assertTrue(e.getMessage().contains("bookings_no_overlap"));
    }

    @Test
    void concurrentRequests_onlyOneWins() throws Exception {
        LocalDate day = freshDay();
        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger ok = new AtomicInteger();
        AtomicInteger conflict = new AtomicInteger();

        List<Future<?>> futures = new java.util.ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(pool.submit(() -> {
                start.await();
                try {
                    bookingService.createBooking(new BookingRequest(day, LocalTime.of(12, 0), LocalTime.of(15, 0),
                            Layout.TABLE, 10, List.of(), "Гонщик", "+375290000000", "racer@example.com"), null);
                    ok.incrementAndGet();
                } catch (BookingConflictException e) {
                    conflict.incrementAndGet();
                }
                return null;
            }));
        }
        start.countDown();
        for (Future<?> f : futures) f.get(30, TimeUnit.SECONDS);
        pool.shutdown();

        assertEquals(1, ok.get(), "ровно одна бронь должна пройти");
        assertEquals(threads - 1, conflict.get());
    }

    @Test
    void validation_returnsFieldErrors() throws Exception {
        String bad = """
                {"date":"%s","startTime":"10:00","endTime":"12:00","layout":"LECTURE","guests":0,
                 "contactName":"","contactPhone":"abc"}
                """.formatted(freshDay());
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.contactPhone").exists())
                .andExpect(jsonPath("$.fields.guests").exists())
                .andExpect(jsonPath("$.fields.contactEmail").value("Укажите email — пришлём подтверждение и напоминание"));
    }

    @Test
    void businessRule_returns422() throws Exception {
        mvc.perform(post("/api/bookings").contentType(MediaType.APPLICATION_JSON).content(bookingJson(freshDay(), "10:30", "12:00")))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.error").value("Бронирование — целыми часами, например 10:00–14:00"));
    }

    @Test
    void security_adminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/bookings")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/bookings/my")).andExpect(status().isUnauthorized());

        String client = field(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ольга\",\"email\":\"olga" + System.nanoTime() + "@example.com\",\"password\":\"secret-pass\"}"))
                .andExpect(status().isCreated()).andReturn(), "token");
        mvc.perform(get("/api/admin/bookings").header("Authorization", "Bearer " + client)).andExpect(status().isForbidden());
        mvc.perform(get("/api/bookings/my").header("Authorization", "Bearer " + client)).andExpect(status().isOk());

        String admin = field(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@arka123.by\",\"password\":\"admin-password\"}"))
                .andExpect(status().isOk()).andReturn(), "token");
        mvc.perform(get("/api/admin/bookings").header("Authorization", "Bearer " + admin)).andExpect(status().isOk());
    }

    @Test
    void adminConfirmsBooking() throws Exception {
        LocalDate day = freshDay();
        MvcResult created = book(day, "09:00", "11:00", 201);
        String id = created.getResponse().getContentAsString().replaceAll(".*\"id\":(\\d+).*", "$1");
        String admin = field(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@arka123.by\",\"password\":\"admin-password\"}")).andReturn(), "token");

        mvc.perform(post("/api/admin/bookings/" + id + "/confirm").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        mvc.perform(post("/api/admin/bookings/" + id + "/confirm").header("Authorization", "Bearer " + admin))
                .andExpect(status().is(422));
    }

    @Test
    void wrongPassword_401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@arka123.by\",\"password\":\"nope\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Неверный email или пароль"));
    }
}
