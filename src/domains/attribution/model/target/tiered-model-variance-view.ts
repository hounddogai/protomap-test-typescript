import { TieredModelVariance } from "./tiered-model-variance.js";

/** How screens and exports show a tiered model variance. */
export class TieredModelVarianceView {
  codeText: string;
  title: string;
  rate: string;
  ceiling: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    rate: string,
    ceiling: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.rate = rate;
    this.ceiling = ceiling;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredModelVarianceView(item: TieredModelVariance): TieredModelVarianceView {
  return new TieredModelVarianceView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredModelVarianceViews(items: TieredModelVariance[]): TieredModelVarianceView[] {
  const views: TieredModelVarianceView[] = [];
  for (const item of items) {
    views.push(toTieredModelVarianceView(item));
  }
  return views;
}

export function sumTieredModelVarianceView(view: TieredModelVarianceView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedRate + parsedCeiling + parsedAttempts;
}
