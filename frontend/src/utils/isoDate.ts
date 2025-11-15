export type DateFormat = "full" | "short" | "time" | "relative";

/**
 * Преобразует ISO-строку в читаемый формат.
 * @param iso ISO-строка, например: "2025-11-12T14:30:00Z"
 * @param format пресет формата вывода
 * @param locale локаль, по умолчанию ru-RU
 */
export function formatISO(
    iso: string,
    format: DateFormat = "relative",
    locale: string = "ru-RU"
): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Некорректная дата";

    switch (format) {
        case "full":
            return new Intl.DateTimeFormat(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }).format(date);

        case "short":
            return new Intl.DateTimeFormat(locale, {
                year: "2-digit",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            }).format(date);

        case "time":
            return new Intl.DateTimeFormat(locale, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }).format(date);

        case "relative": {
            const diff = Date.now() - date.getTime();
            const sec = Math.floor(diff / 1000);
            const min = Math.floor(sec / 60);
            const hr = Math.floor(min / 60);
            const day = Math.floor(hr / 24);

            if (sec < 60) return "только что";
            if (min < 60) return `${min} мин назад`;
            if (hr < 24) return `${hr} ч назад`;
            if (day < 7) return `${day} д назад`;

            return new Intl.DateTimeFormat(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
            }).format(date);
        }

        default:
            return "—";
    }
}
