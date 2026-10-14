import * as text from "../../../../kit/text.js";
import { PaywallSummary } from "./paywall-summary.js";

/** How screens and exports show a paywall summary. */
export class PaywallSummaryView {
  code: string;
  label: string;
  approvedText: string;
  channelText: string;
  timezoneText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    approvedText: string,
    channelText: string,
    timezoneText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.approvedText = approvedText;
    this.channelText = channelText;
    this.timezoneText = timezoneText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallSummaryView(item: PaywallSummary): PaywallSummaryView {
  return new PaywallSummaryView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    `${item.approved}`,
    item.channel,
    item.timezone,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallSummaryViews(items: PaywallSummary[]): PaywallSummaryView[] {
  const views: PaywallSummaryView[] = [];
  for (const item of items) {
    views.push(toPaywallSummaryView(item));
  }
  return views;
}

export function sumPaywallSummaryView(view: PaywallSummaryView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedMargin;
}
