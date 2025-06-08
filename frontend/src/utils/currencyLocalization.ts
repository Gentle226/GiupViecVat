export const formatCurrency = (
  amount: number,
  language: string = "en"
): string => {
  if (language === "vi") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } else {
    // For English users, show VND in a more readable format
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
};

export const formatCompactCurrency = (
  amount: number,
  language: string = "en"
): string => {
  if (language === "vi") {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} triệu VND`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k VND`;
    }
    return `${amount.toLocaleString("vi-VN")} VND`;
  } else {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VND`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k VND`;
    }
    return `${amount.toLocaleString("en-US")} VND`;
  }
};

// For budget ranges
export const formatBudgetRange = (
  min: number,
  max: number,
  language: string = "en"
): string => {
  const formatShort = (amount: number) => {
    if (language === "vi") {
      if (amount >= 1000000) return `${amount / 1000000}tr`;
      if (amount >= 1000) return `${amount / 1000}k`;
      return amount.toString();
    } else {
      if (amount >= 1000000) return `${amount / 1000000}M`;
      if (amount >= 1000) return `${amount / 1000}k`;
      return amount.toString();
    }
  };

  return `${formatShort(min)} - ${formatShort(max)} VND`;
};
