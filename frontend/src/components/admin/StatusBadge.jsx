const STATUS_TEXT = { PENDING: "Ждёт подтверждения", CONFIRMED: "Подтверждена", CANCELLED: "Отменена" };

export default function StatusBadge({ status }) {
  return <span className={`abadge abadge--${status.toLowerCase()}`}>{STATUS_TEXT[status]}</span>;
}
