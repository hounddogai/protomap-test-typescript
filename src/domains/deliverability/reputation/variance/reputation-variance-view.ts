import { ReputationVariance } from "./reputation-variance.js";

/** How screens and exports show a reputation variance. */
export class ReputationVarianceView {
  code: string;
  nameText: string;
  audienceId: string;
  description: string;
  locale: string;
  quantityText: string;
  attempts: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    audienceId: string,
    description: string,
    locale: string,
    quantityText: string,
    attempts: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.audienceId = audienceId;
    this.description = description;
    this.locale = locale;
    this.quantityText = quantityText;
    this.attempts = attempts;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toReputationVarianceView(item: ReputationVariance): ReputationVarianceView {
  return new ReputationVarianceView(
    item.code,
    item.name,
    item.audienceId,
    item.description,
    item.locale,
    String(item.quantity),
    String(item.attempts),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationVarianceViews(items: ReputationVariance[]): ReputationVarianceView[] {
  const views: ReputationVarianceView[] = [];
  for (const item of items) {
    views.push(toReputationVarianceView(item));
  }
  return views;
}

export function sumReputationVarianceView(view: ReputationVarianceView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedQuantity + parsedAttempts;
}
