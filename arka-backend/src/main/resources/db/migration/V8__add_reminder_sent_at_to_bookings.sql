-- когда отправили напоминание за день — чтобы не слать его повторно
ALTER TABLE bookings ADD COLUMN reminder_sent_at TIMESTAMP;
