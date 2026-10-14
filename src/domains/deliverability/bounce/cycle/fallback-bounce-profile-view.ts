import { FallbackBounceProfile } from "./fallback-bounce-profile.js";

/** How screens and exports show a fallback bounce profile. */
export class FallbackBounceProfileView {
  codeText: string;
  name: string;
  variant: string;
  graceDays: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    variant: string,
    graceDays: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.variant = variant;
    this.graceDays = graceDays;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBounceProfileView(item: FallbackBounceProfile): FallbackBounceProfileView {
  return new FallbackBounceProfileView(
    item.code,
    item.name,
    item.variant,
    String(item.graceDays),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBounceProfileViews(items: FallbackBounceProfile[]): FallbackBounceProfileView[] {
  const views: FallbackBounceProfileView[] = [];
  for (const item of items) {
    views.push(toFallbackBounceProfileView(item));
  }
  return views;
}

export function sumFallbackBounceProfileView(view: FallbackBounceProfileView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
