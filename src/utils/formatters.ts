export function formatIndianCurrency(value?: number) {
  if (value === undefined || value === null) {
    return "₹0";
  }

  return `₹ ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}