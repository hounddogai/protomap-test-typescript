import * as text from "../../../../kit/text.js";
import { TouchpointWindow } from "./touchpoint-window.js";

/** How screens and exports show a touchpoint window. */
export class TouchpointWindowView {
  code: string;
  name: string;
  ownerIdText: string;
  attempts: string;
  label: string;
  weight: string;
  costText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerIdText: string,
    attempts: string,
    label: string,
    weight: string,
    costText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerIdText = ownerIdText;
    this.attempts = attempts;
    this.label = label;
    this.weight = weight;
    this.costText = costText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointWindowView(item: TouchpointWindow): TouchpointWindowView {
  return new TouchpointWindowView(
    item.code,
    item.name,
    text.truncate(item.ownerId, 120),
    String(item.attempts),
    item.label,
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointWindowViews(items: TouchpointWindow[]): TouchpointWindowView[] {
  const views: TouchpointWindowView[] = [];
  for (const item of items) {
    views.push(toTouchpointWindowView(item));
  }
  return views;
}

export function sumTouchpointWindowView(view: TouchpointWindowView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedAttempts + parsedWeight + parsedCost;
}
