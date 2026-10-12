package com.arka.backend.notification;

import com.arka.backend.entity.Booking;
import com.arka.backend.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Письма по событиям брони. Отправка — только после коммита (AFTER_COMMIT) и в фоне (@Async):
 * если почта недоступна, бронь всё равно сохранена, а ошибка лишь пишется в лог.
 */
@Component
public class BookingMailNotifier {

    private static final Logger log = LoggerFactory.getLogger(BookingMailNotifier.class);
    private static final Locale RU = Locale.forLanguageTag("ru");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMMM", RU);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final BookingRepository bookingRepository;
    private final MailService mailService;
    private final String siteUrl;
    private final String adminTo;

    public BookingMailNotifier(BookingRepository bookingRepository, MailService mailService,
                               @Value("${app.site-url}") String siteUrl, @Value("${app.mail.admin-to:}") String adminTo) {
        this.bookingRepository = bookingRepository;
        this.mailService = mailService;
        this.siteUrl = siteUrl;
        this.adminTo = adminTo;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void on(BookingEvent event) {
        Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
        if (b == null) {
            return;
        }
        Map<String, Object> model = model(b);
        String when = model.get("dateText") + ", " + model.get("timeText");
        try {
            switch (event.type()) {
                case CREATED -> {
                    sendToGuest(b, "Заявка принята — " + when, "created", model);
                    if (!adminTo.isBlank()) {
                        mailService.send(adminTo, "Новая бронь: " + when + ", " + b.getContactName(), "admin-new", model);
                    }
                }
                case CONFIRMED -> sendToGuest(b, "Бронь подтверждена — " + when, "confirmed", model);
                case CANCELLED -> {
                    model.put("reasonText", reasonText(event.reason()));
                    sendToGuest(b, "Бронь отменена — " + when, "cancelled", model);
                }
                case REMINDER -> sendToGuest(b, "Завтра встречаемся напротив Библиотеки — " + model.get("timeText"), "reminder", model);
            }
        } catch (Exception e) {
            log.warn("Письмо по брони {} ({}) не отправлено: {}", b.getBookingId(), event.type(), e.getMessage());
        }
    }

    private void sendToGuest(Booking b, String subject, String template, Map<String, Object> model) throws Exception {
        if (b.getContactEmail() == null || b.getContactEmail().isBlank()) {
            return; // старые брони до обязательного email
        }
        mailService.send(b.getContactEmail(), subject, template, model);
    }

    private Map<String, Object> model(Booking b) {
        Map<String, Object> m = new HashMap<>();
        String weekday = b.getDate().getDayOfWeek().getDisplayName(TextStyle.FULL, RU);
        m.put("b", b);
        m.put("dateText", b.getDate().format(DATE));
        m.put("weekday", weekday);
        m.put("timeText", b.getStartTime().format(TIME) + "–" + b.getEndTime().format(TIME));
        m.put("layoutText", b.getLayout().getTitle());
        m.put("services", b.getExtras().stream()
                .map(e -> e.getService().getName() + (e.getPrice().signum() == 0 ? " — входит в тариф" : ""))
                .toList());
        m.put("total", b.getTotalPrice().stripTrailingZeros().toPlainString() + " BYN");
        m.put("bookingUrl", siteUrl + "/booking/" + b.getPublicCode());
        m.put("siteUrl", siteUrl);
        m.put("address", b.getHall().getAddress());
        return m;
    }

    private static String reasonText(BookingEvent.CancelReason reason) {
        if (reason == null) return "Бронь отменена.";
        return switch (reason) {
            case BY_GUEST -> "Вы отменили бронь по ссылке из письма или на сайте.";
            case BY_ADMIN -> "Бронь отменил администратор. Если это неожиданно — позвоните нам, разберёмся.";
            case NOT_CONFIRMED -> "Мы не успели подтвердить заявку в течение суток, и слот освободился. Выберите время заново — постараемся подтвердить быстрее.";
        };
    }
}
