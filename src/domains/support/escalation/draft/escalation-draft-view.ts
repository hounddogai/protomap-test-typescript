import { EscalationDraft } from "./escalation-draft.js";

/** How screens and exports show a escalation draft. */
export class EscalationDraftView {
  code: string;
  label: string;
  utmSource: string;
  nameText: string;
  marginText: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    nameText: string,
    marginText: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.nameText = nameText;
    this.marginText = marginText;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationDraftView(item: EscalationDraft): EscalationDraftView {
  return new EscalationDraftView(
    item.code,
    item.label,
    item.utmSource,
    item.name,
    item.margin.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationDraftViews(items: EscalationDraft[]): EscalationDraftView[] {
  const views: EscalationDraftView[] = [];
  for (const item of items) {
    views.push(toEscalationDraftView(item));
  }
  return views;
}

export function sumEscalationDraftView(view: EscalationDraftView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedMargin + parsedDiscount;
}
