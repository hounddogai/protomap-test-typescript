import { FallbackSenderProfile } from "./fallback-sender-profile.js";

/** How screens and exports show a fallback sender profile. */
export class FallbackSenderProfileView {
  code: string;
  labelText: string;
  channel: string;
  phone: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    phone: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.phone = phone;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSenderProfileView(item: FallbackSenderProfile): FallbackSenderProfileView {
  return new FallbackSenderProfileView(
    item.code,
    item.label,
    item.channel,
    item.phone,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSenderProfileViews(items: FallbackSenderProfile[]): FallbackSenderProfileView[] {
  const views: FallbackSenderProfileView[] = [];
  for (const item of items) {
    views.push(toFallbackSenderProfileView(item));
  }
  return views;
}

export function sumFallbackSenderProfileView(view: FallbackSenderProfileView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
