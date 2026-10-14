import { DeflectionCheckpoint } from "./deflection-checkpoint.js";

/** How screens and exports show a deflection checkpoint. */
export class DeflectionCheckpointView {
  code: string;
  name: string;
  ownerIdText: string;
  rateText: string;
  weightText: string;
  ratio: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerIdText: string,
    rateText: string,
    weightText: string,
    ratio: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerIdText = ownerIdText;
    this.rateText = rateText;
    this.weightText = weightText;
    this.ratio = ratio;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionCheckpointView(item: DeflectionCheckpoint): DeflectionCheckpointView {
  return new DeflectionCheckpointView(
    item.code,
    item.name,
    item.ownerId,
    item.rate.toFixed(2),
    item.weight.toFixed(2),
    item.ratio.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionCheckpointViews(items: DeflectionCheckpoint[]): DeflectionCheckpointView[] {
  const views: DeflectionCheckpointView[] = [];
  for (const item of items) {
    views.push(toDeflectionCheckpointView(item));
  }
  return views;
}

export function sumDeflectionCheckpointView(view: DeflectionCheckpointView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRate + parsedWeight + parsedRatio;
}
