import { SeasonalMacroRequest } from "./seasonal-macro-request.js";

/** How screens and exports show a seasonal macro request. */
export class SeasonalMacroRequestView {
  codeText: string;
  name: string;
  updatedAt: string;
  variantText: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    updatedAt: string,
    variantText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.updatedAt = updatedAt;
    this.variantText = variantText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalMacroRequestView(item: SeasonalMacroRequest): SeasonalMacroRequestView {
  return new SeasonalMacroRequestView(
    item.code,
    item.name,
    String(item.updatedAt),
    item.variant,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalMacroRequestViews(items: SeasonalMacroRequest[]): SeasonalMacroRequestView[] {
  const views: SeasonalMacroRequestView[] = [];
  for (const item of items) {
    views.push(toSeasonalMacroRequestView(item));
  }
  return views;
}

export function sumSeasonalMacroRequestView(view: SeasonalMacroRequestView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
