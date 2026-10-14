import { PlacementCheckpoint } from "./placement-checkpoint.js";

/** How screens and exports show a placement checkpoint. */
export class PlacementCheckpointView {
  code: string;
  label: string;
  attemptsText: string;
  country: string;
  amount: string;
  revision: string;
  visible: string;
  clicksText: string;
  categoryText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    attemptsText: string,
    country: string,
    amount: string,
    revision: string,
    visible: string,
    clicksText: string,
    categoryText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.attemptsText = attemptsText;
    this.country = country;
    this.amount = amount;
    this.revision = revision;
    this.visible = visible;
    this.clicksText = clicksText;
    this.categoryText = categoryText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementCheckpointView(item: PlacementCheckpoint): PlacementCheckpointView {
  return new PlacementCheckpointView(
    item.code,
    item.label,
    String(item.attempts),
    item.country,
    item.amount.toFixed(2),
    String(item.revision),
    `${item.visible}`,
    String(item.clicks),
    item.category,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementCheckpointViews(items: PlacementCheckpoint[]): PlacementCheckpointView[] {
  const views: PlacementCheckpointView[] = [];
  for (const item of items) {
    views.push(toPlacementCheckpointView(item));
  }
  return views;
}

export function sumPlacementCheckpointView(view: PlacementCheckpointView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedAttempts + parsedAmount + parsedRevision;
}
