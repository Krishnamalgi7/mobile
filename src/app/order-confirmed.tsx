import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, CheckCircle, Download } from "lucide-react-native";
import * as Print from "expo-print";

import { useTheme } from "../hooks/use-theme";
import { API_URL } from "../constants/config";

type InvoiceItem = {
  phoneId: string;
  itemDescription: string;
  quantity: number;
  originalPrice: number;
  discount: number;
  priceAfterDiscount: number;
  taxableAmount: number;
};

type Invoice = {
  invoiceNumber: string;
  invoiceDate: string;
  storeName: string;
  storeLogo?: string;
  storeAddress: string;
  storePhone: string;
  storeGstNumber: string;

  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;

  items: InvoiceItem[];

  gstPercentage: number;
  gstAmount: number;
  taxableSubtotal: number;
  roundedOff: number;
  totalAmount: number;
  amountInWords: string;
};

const formatCurrency = (value: number) => {
  return `₹${Math.floor(Number(value || 0)).toLocaleString("en-IN")}`;
};

const escapeHtml = (value: unknown) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export default function OrderConfirmed() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
  invoice?: string;
  source?: string;
}>();

const isHistoricalOrder = params.source === "history";

  const [downloading, setDownloading] = useState(false);

  let invoice: Invoice | null = null;

  try {
    if (params.invoice) {
      invoice = JSON.parse(params.invoice);
    }
  } catch (error) {
    console.error("Failed to parse invoice:", error);
  }

  const handleDownloadInvoice = async () => {
    if (!invoice) {
      console.error("Invoice data is missing");
      return;
    }

    try {
      setDownloading(true);

      const logoUrl = invoice.storeLogo
        ? invoice.storeLogo.startsWith("http")
          ? invoice.storeLogo
          : `${API_URL}${invoice.storeLogo}`
        : "";

      const invoiceDate = new Date(
        invoice.invoiceDate
      ).toLocaleDateString("en-IN");

      const itemsHtml = invoice.items
        .map(
          (item) => `
            <tr>
              <td class="item">
                ${escapeHtml(item.itemDescription)}
              </td>

              <td class="center">
                ${item.quantity}
              </td>

              <td class="right">
                ${formatCurrency(item.originalPrice)}
              </td>

              <td class="right">
                ${formatCurrency(item.discount)}
              </td>

              <td class="right">
                ${formatCurrency(item.priceAfterDiscount)}
              </td>

              <td class="right bold">
                ${formatCurrency(item.taxableAmount)}
              </td>
            </tr>
          `
        )
        .join("");

      const html = `
        <!DOCTYPE html>

        <html>
          <head>

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <style>

              @page {
                size: A4;
                margin: 0;
              }

              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                width: 210mm;
                min-height: 297mm;
                background: #ffffff;
                font-family: Arial, Helvetica, sans-serif;
                color: #111111;
              }

              body {
                padding: 6mm;
              }

              .invoice {
                width: 198mm;
                min-height: 285mm;
                border: 1px solid #d1d5db;
                border-radius: 5mm;
                padding: 7mm;
                background: #ffffff;
              }

              /* -------------------------
                 HEADER
              ------------------------- */

              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
              }

              .store-section {
                display: flex;
                align-items: flex-start;
                width: 62%;
              }

              .logo {
                width: 31mm;
                height: 31mm;
                object-fit: contain;
                border-radius: 4mm;
                margin-right: 5mm;
              }

              .store-details {
                padding-top: 1mm;
              }

              .store-name {
                margin: 0;
                font-size: 20px;
                line-height: 1.2;
                font-weight: 700;
              }

              .store-address {
                margin-top: 3mm;
                font-size: 11px;
                line-height: 1.45;
                color: #4b5563;
                max-width: 105mm;
              }

              .store-contact {
                margin-top: 2mm;
                font-size: 11px;
                line-height: 1.4;
              }

              .invoice-section {
                width: 35%;
                text-align: right;
                padding-top: 1mm;
              }

              .tax-invoice {
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 1.2px;
              }

              .invoice-number {
                margin-top: 3mm;
                font-size: 15px;
                font-weight: 700;
              }

              .invoice-date {
                margin-top: 3mm;
                font-size: 11px;
                color: #4b5563;
              }

              .divider {
                border-top: 1px solid #d1d5db;
                margin: 5mm 0;
              }

              /* -------------------------
                 BILL TO
              ------------------------- */

              .bill-title {
                font-size: 11px;
                color: #4b5563;
              }

              .customer-name {
                margin-top: 2mm;
                font-size: 14px;
                font-weight: 700;
              }

              .customer-detail {
                margin-top: 1.5mm;
                font-size: 11px;
                line-height: 1.35;
              }

              /* -------------------------
                 ITEMS TABLE
              ------------------------- */

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5mm;
                table-layout: fixed;
                font-size: 10px;
              }

              th {
                padding: 3mm 2mm;
                border-top: 1px solid #d1d5db;
                border-bottom: 1px solid #d1d5db;
                font-size: 10px;
                font-weight: 700;
                text-align: left;
              }

              td {
                padding: 4mm 2mm;
                border-bottom: 1px solid #d1d5db;
                font-size: 10px;
                vertical-align: middle;
              }

              th:nth-child(1),
              td:nth-child(1) {
                width: 22%;
              }

              th:nth-child(2),
              td:nth-child(2) {
                width: 8%;
                text-align: center;
              }

              th:nth-child(3),
              td:nth-child(3) {
                width: 17%;
                text-align: right;
              }

              th:nth-child(4),
              td:nth-child(4) {
                width: 15%;
                text-align: right;
              }

              th:nth-child(5),
              td:nth-child(5) {
                width: 19%;
                text-align: right;
              }

              th:nth-child(6),
              td:nth-child(6) {
                width: 19%;
                text-align: right;
              }

              .item {
                text-align: left;
              }

              .center {
                text-align: center;
              }

              .right {
                text-align: right;
              }

              .bold {
                font-weight: 700;
              }

              /* -------------------------
                 AMOUNT + TOTALS
              ------------------------- */

              .summary {
                display: flex;
                justify-content: space-between;
                margin-top: 8mm;
              }

              .amount-words {
                width: 50%;
                padding-right: 8mm;
              }

              .summary-title {
                font-size: 11px;
                font-weight: 700;
                color: #4b5563;
              }

              .amount-text {
                margin-top: 3mm;
                font-size: 11px;
                line-height: 1.6;
              }

              .totals {
                width: 48%;
              }

              .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 3.5mm;
                font-size: 11px;
              }

              .total-label {
                color: #6b7280;
              }

              .final-total {
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #d1d5db;
                margin-top: 3mm;
                padding-top: 4mm;
                font-size: 16px;
                font-weight: 700;
              }

              /* -------------------------
                 FOOTER
              ------------------------- */

              .footer {
                margin-top: 8mm;
                border-top: 1px solid #d1d5db;
                padding-top: 7mm;
              }

              .footer-content {
                display: flex;
                justify-content: space-between;
              }

              .terms {
                width: 55%;
              }

              .terms-title {
                font-size: 11px;
                font-weight: 700;
              }

              .terms-list {
                margin-top: 2mm;
                padding-left: 5mm;
                color: #6b7280;
                font-size: 9px;
                line-height: 1.7;
              }

              .signature {
                width: 40%;
                text-align: right;
                padding-top: 8mm;
              }

              .signature-line {
                width: 48mm;
                height: 10mm;
                margin-left: auto;
                border-bottom: 1px solid #d1d5db;
              }

              .signature-text {
                margin-top: 3mm;
                font-size: 10px;
                font-weight: 700;
              }

              .thank-you {
                margin-top: 9mm;
                text-align: center;
              }

              .thank-you-main {
                font-size: 11px;
                font-weight: 700;
              }

              .thank-you-sub {
                margin-top: 2mm;
                font-size: 9px;
                color: #6b7280;
              }

            </style>

          </head>

          <body>

            <div class="invoice">

              <!-- HEADER -->

              <div class="header">

                <div class="store-section">

                  ${
                    logoUrl
                      ? `
                        <img
                          src="${escapeHtml(logoUrl)}"
                          class="logo"
                        />
                      `
                      : ""
                  }

                  <div class="store-details">

                    <div class="store-name">
                      ${escapeHtml(invoice.storeName)}
                    </div>

                    <div class="store-address">
                      ${escapeHtml(invoice.storeAddress)}
                    </div>

                    <div class="store-contact">
                      <strong>Phone:</strong>
                      ${escapeHtml(invoice.storePhone || "—")}
                      &nbsp;&nbsp;&nbsp;&nbsp;

                      <strong>GSTIN:</strong>
                      ${escapeHtml(invoice.storeGstNumber || "—")}
                    </div>

                  </div>

                </div>

                <div class="invoice-section">

                  <div class="tax-invoice">
                    TAX INVOICE
                  </div>

                  <div class="invoice-number">
                    ${escapeHtml(invoice.invoiceNumber)}
                  </div>

                  <div class="invoice-date">
                    Date: ${escapeHtml(invoiceDate)}
                  </div>

                </div>

              </div>

              <div class="divider"></div>

              <!-- BILL TO -->

              <div>

                <div class="bill-title">
                  Bill To
                </div>

                <div class="customer-name">
                  ${escapeHtml(invoice.customerName)}
                </div>

                <div class="customer-detail">
                  ${escapeHtml(invoice.customerPhone)}
                </div>

                <div class="customer-detail">
                  ${escapeHtml(invoice.customerEmail)}
                </div>

                <div class="customer-detail">
                  ${escapeHtml(invoice.customerAddress)}
                </div>

              </div>

              <!-- ITEMS -->

              <table>

                <thead>

                  <tr>

                    <th>Item</th>

                    <th style="text-align:center;">
                      Qty
                    </th>

                    <th style="text-align:right;">
                      Original Price
                    </th>

                    <th style="text-align:right;">
                      Discount
                    </th>

                    <th style="text-align:right;">
                      Net Unit Price
                    </th>

                    <th style="text-align:right;">
                      Line Total
                    </th>

                  </tr>

                </thead>

                <tbody>
                  ${itemsHtml}
                </tbody>

              </table>

              <!-- SUMMARY -->

              <div class="summary">

                <div class="amount-words">

                  <div class="summary-title">
                    Amount in Words
                  </div>

                  <div class="amount-text">
                    ${escapeHtml(invoice.amountInWords)}
                  </div>

                </div>

                <div class="totals">

                  <div class="total-row">

                    <span class="total-label">
                      Subtotal
                    </span>

                    <span>
                      ${formatCurrency(invoice.taxableSubtotal)}
                    </span>

                  </div>

                  <div class="total-row">

                    <span class="total-label">
                      GST (${invoice.gstPercentage}%)
                    </span>

                    <span>
                      ${formatCurrency(invoice.gstAmount)}
                    </span>

                  </div>

                  <div class="total-row">

                    <span class="total-label">
                      Round Off
                    </span>

                    <span>
                      ${formatCurrency(invoice.roundedOff)}
                    </span>

                  </div>

                  <div class="final-total">

                    <span>
                      Total
                    </span>

                    <span>
                      ${formatCurrency(invoice.totalAmount)}
                    </span>

                  </div>

                </div>

              </div>

              <!-- FOOTER -->

              <div class="footer">

                <div class="footer-content">

                  <div class="terms">

                    <div class="terms-title">
                      Terms & Conditions
                    </div>

                    <ul class="terms-list">

                      <li>
                        Goods once sold are subject to store policy.
                      </li>

                      <li>
                        Please retain this invoice for future reference.
                      </li>

                      <li>
                        Warranty is subject to the manufacturer's terms.
                      </li>

                    </ul>

                  </div>

                  <div class="signature">

                    <div class="signature-line"></div>

                    <div class="signature-text">
                      Customer Signatory
                    </div>

                  </div>

                </div>

                <div class="thank-you">

                  <div class="thank-you-main">
                    Thank you for your purchase.
                  </div>

                  <div class="thank-you-sub">
                    We appreciate your choice.
                  </div>

                </div>

              </div>

            </div>

          </body>
        </html>
      `;

      await Print.printAsync({
  html,
});
    } catch (error) {
      console.error("Invoice download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (!invoice) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: theme.background,
        }}
      >
        <Text
          className="text-center text-lg font-semibold"
          style={{
            color: theme.text,
          }}
        >
          Invoice data could not be loaded.
        </Text>

        <TouchableOpacity
          className="mt-6 rounded-xl px-6 py-3"
          style={{
            backgroundColor: theme.accent,
          }}
          onPress={() => router.replace("/")}
        >
          <Text
            className="font-semibold"
            style={{
              color: theme.background,
            }}
          >
            Continue Shopping
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: theme.background,
      }}
    >

      {/* Back Button */}
    <View
  className="px-5 pb-3"
  style={{ paddingTop: insets.top + 8 }}
>
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.7}
        className="h-10 w-10 items-center justify-center rounded-full border"
        style={{
          backgroundColor: theme.secondary,
          borderColor: theme.border,
        }}
      >
        <ArrowLeft size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
    
      <View className="flex-1 items-center justify-center px-6">

        <View
          className="mb-6 h-20 w-20 items-center justify-center rounded-full"
          style={{
            backgroundColor: theme.secondary,
          }}
        >
          <CheckCircle
            size={52}
            color={theme.accent}
            strokeWidth={2}
          />
        </View>

        <Text
          className="text-center text-2xl font-bold"
          style={{
            color: theme.text,
          }}
        >
          {isHistoricalOrder ? "Your Invoice" : "Order Confirmed"}
        </Text>

        <Text
          className="mt-3 text-center text-base"
          style={{
            color: theme.secondaryText,
          }}
        >
          {isHistoricalOrder
  ? "View or print the invoice for your previous order."
  : "Your order has been successfully booked."}
        </Text>

        <Text
          className="mt-2 text-center text-sm font-semibold"
          style={{
            color: theme.text,
          }}
        >
          {invoice.invoiceNumber}
        </Text>

        <TouchableOpacity
          className="mt-8 w-full flex-row items-center justify-center rounded-xl py-4"
          style={{
            backgroundColor: theme.accent,
          }}
          onPress={handleDownloadInvoice}
          disabled={downloading}
        >
          <Download
            size={20}
            color={theme.background}
            strokeWidth={2}
          />

          <Text
            className="ml-2 text-base font-semibold"
            style={{
              color: theme.background,
            }}
          >
            {downloading
              ? "Preparing Invoice..."
              : "Download Invoice"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 w-full rounded-xl border py-4"
          style={{
            borderColor: theme.border,
          }}
          onPress={() => router.replace("/")}
        >
          <Text
            className="text-center text-base font-semibold"
            style={{
              color: theme.text,
            }}
          >
            Continue Shopping
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}