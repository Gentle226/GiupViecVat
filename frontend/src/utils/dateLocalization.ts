import { format, parseISO } from "date-fns";
import { vi, enUS } from "date-fns/locale";

export const getDateLocale = (language: string) => {
  switch (language) {
    case "vi":
      return vi;
    case "en":
    default:
      return enUS;
  }
};

export const formatLocalizedDate = (
  date: string | Date,
  formatString: string = "dd/MM/yyyy",
  language: string = "en"
): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const locale = getDateLocale(language);

  return format(dateObj, formatString, { locale });
};

export const formatLocalizedDateTime = (
  date: string | Date,
  language: string = "en"
): string => {
  const formatString =
    language === "vi" ? "dd/MM/yyyy HH:mm" : "MM/dd/yyyy h:mm a";
  return formatLocalizedDate(date, formatString, language);
};

export const formatRelativeTime = (
  date: string | Date,
  language: string = "en"
): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - dateObj.getTime()) / (1000 * 60)
  );

  if (language === "vi") {
    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return formatLocalizedDate(dateObj, "dd/MM/yyyy", language);
  } else {
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return formatLocalizedDate(dateObj, "MM/dd/yyyy", language);
  }
};
