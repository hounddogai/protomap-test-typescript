import { DefaultMacroBaseline } from "./default-macro-baseline.js";

/** How screens and exports show a default macro baseline. */
export class DefaultMacroBaselineView {
  code: string;
  nameText: string;
  amount: string;
  endsAt: string;
  ratioText: string;
  localeText: string;
  capacityText: string;
  countryText: string;
  ceilingText: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    amount: string,
    endsAt: string,
    ratioText: string,
    localeText: string,
    capacityText: string,
    countryText: string,
    ceilingText: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.amount = amount;
    this.endsAt = endsAt;
    this.ratioText = ratioText;
    this.localeText = localeText;
    this.capacityText = capacityText;
    this.countryText = countryText;
    this.ceilingText = ceilingText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultMacroBaselineView(item: DefaultMacroBaseline): DefaultMacroBaselineView {
  return new DefaultMacroBaselineView(
    item.code,
    item.name,
    item.amount.toFixed(2),
    String(item.endsAt),
    item.ratio.toFixed(2),
    item.locale,
    String(item.capacity),
    item.country,
    item.ceiling.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultMacroBaselineViews(items: DefaultMacroBaseline[]): DefaultMacroBaselineView[] {
  const views: DefaultMacroBaselineView[] = [];
  for (const item of items) {
    views.push(toDefaultMacroBaselineView(item));
  }
  return views;
}

export function sumDefaultMacroBaselineView(view: DefaultMacroBaselineView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedAmount + parsedEndsAt + parsedRatio;
}
