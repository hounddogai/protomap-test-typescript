import * as text from "../../../../kit/text.js";
import { PrimaryComplaintMapping } from "./primary-complaint-mapping.js";

/** How screens and exports show a primary complaint mapping. */
export class PrimaryComplaintMappingView {
  code: string;
  name: string;
  ownerId: string;
  budget: string;
  version: string;
  variant: string;
  weightText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    budget: string,
    version: string,
    variant: string,
    weightText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.budget = budget;
    this.version = version;
    this.variant = variant;
    this.weightText = weightText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryComplaintMappingView(item: PrimaryComplaintMapping): PrimaryComplaintMappingView {
  return new PrimaryComplaintMappingView(
    item.code,
    text.truncate(item.name, 40),
    item.ownerId,
    item.budget.toFixed(2),
    String(item.version),
    text.truncate(item.variant, 64),
    item.weight.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryComplaintMappingViews(items: PrimaryComplaintMapping[]): PrimaryComplaintMappingView[] {
  const views: PrimaryComplaintMappingView[] = [];
  for (const item of items) {
    views.push(toPrimaryComplaintMappingView(item));
  }
  return views;
}

export function sumPrimaryComplaintMappingView(view: PrimaryComplaintMappingView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedBudget + parsedVersion + parsedWeight;
}
