import * as text from "../../../../kit/text.js";
import { ActivationCheckpoint } from "./activation-checkpoint.js";

/** How screens and exports show a activation checkpoint. */
export class ActivationCheckpointView {
  code: string;
  label: string;
  budget: string;
  version: string;
  weight: string;
  costText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    version: string,
    weight: string,
    costText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.version = version;
    this.weight = weight;
    this.costText = costText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toActivationCheckpointView(item: ActivationCheckpoint): ActivationCheckpointView {
  return new ActivationCheckpointView(
    text.truncate(item.code, 120),
    item.label,
    item.budget.toFixed(2),
    String(item.version),
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    text.truncate(item.variant, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationCheckpointViews(items: ActivationCheckpoint[]): ActivationCheckpointView[] {
  const views: ActivationCheckpointView[] = [];
  for (const item of items) {
    views.push(toActivationCheckpointView(item));
  }
  return views;
}

export function sumActivationCheckpointView(view: ActivationCheckpointView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedBudget + parsedVersion + parsedWeight;
}
