import * as text from "../../../../kit/text.js";
import { PaywallLedger } from "./paywall-ledger.js";

/** How screens and exports show a paywall ledger. */
export class PaywallLedgerView {
  code: string;
  title: string;
  sourceText: string;
  priorityText: string;
  category: string;
  endsAtText: string;
  activeText: string;
  visible: string;
  margin: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sourceText: string,
    priorityText: string,
    category: string,
    endsAtText: string,
    activeText: string,
    visible: string,
    margin: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sourceText = sourceText;
    this.priorityText = priorityText;
    this.category = category;
    this.endsAtText = endsAtText;
    this.activeText = activeText;
    this.visible = visible;
    this.margin = margin;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallLedgerView(item: PaywallLedger): PaywallLedgerView {
  return new PaywallLedgerView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 80),
    text.truncate(item.source, 40),
    String(item.priority),
    item.category,
    String(item.endsAt),
    `${item.active}`,
    `${item.visible}`,
    item.margin.toFixed(2),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallLedgerViews(items: PaywallLedger[]): PaywallLedgerView[] {
  const views: PaywallLedgerView[] = [];
  for (const item of items) {
    views.push(toPaywallLedgerView(item));
  }
  return views;
}

export function sumPaywallLedgerView(view: PaywallLedgerView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedPriority + parsedEndsAt + parsedMargin;
}
