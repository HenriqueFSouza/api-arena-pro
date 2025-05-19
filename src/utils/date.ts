import { formatInTimeZone } from "date-fns-tz";

export const dateNowWithTimezone = () => {
    const now = new Date();
    const dateWithTimezone = formatInTimeZone(now, 'America/Sao_Paulo', "yyyy-MM-dd HH:mm:ss");

    const dateToAddTimezone = dateWithTimezone.split(' ');

    const finalDate = `${dateToAddTimezone[0]}T${dateToAddTimezone[1]}.000Z`;

    return finalDate;
}
