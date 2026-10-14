import * as text from "../../../../kit/text.js";
import { ProofWindow } from "./proof-window.js";

/** How screens and exports show a proof window. */
export class ProofWindowView {
  code: string;
  name: string;
  updatedAtText: string;
  category: string;
  retries: string;
  costText: string;
  activeText: string;
  region: string;
  externalRef: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAtText: string,
    category: string,
    retries: string,
    costText: string,
    activeText: string,
    region: string,
    externalRef: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAtText = updatedAtText;
    this.category = category;
    this.retries = retries;
    this.costText = costText;
    this.activeText = activeText;
    this.region = region;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toProofWindowView(item: ProofWindow): ProofWindowView {
  return new ProofWindowView(
    item.code,
    text.truncate(item.name, 40),
    String(item.updatedAt),
    item.category,
    String(item.retries),
    item.cost.toFixed(2),
    `${item.active}`,
    text.truncate(item.region, 120),
    item.externalRef,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofWindowViews(items: ProofWindow[]): ProofWindowView[] {
  const views: ProofWindowView[] = [];
  for (const item of items) {
    views.push(toProofWindowView(item));
  }
  return views;
}

export function sumProofWindowView(view: ProofWindowView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedUpdatedAt + parsedRetries + parsedCost;
}
