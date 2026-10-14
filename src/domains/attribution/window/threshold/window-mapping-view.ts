import * as text from "../../../../kit/text.js";
import { WindowMapping } from "./window-mapping.js";

/** How screens and exports show a window mapping. */
export class WindowMappingView {
  code: string;
  nameText: string;
  budget: string;
  descriptionText: string;
  audienceId: string;
  startsAt: string;
  priority: string;
  externalRef: string;
  updatedAtText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    descriptionText: string,
    audienceId: string,
    startsAt: string,
    priority: string,
    externalRef: string,
    updatedAtText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.descriptionText = descriptionText;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.priority = priority;
    this.externalRef = externalRef;
    this.updatedAtText = updatedAtText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toWindowMappingView(item: WindowMapping): WindowMappingView {
  return new WindowMappingView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    item.budget.toFixed(2),
    text.truncate(item.description, 120),
    text.truncate(item.audienceId, 64),
    String(item.startsAt),
    String(item.priority),
    item.externalRef,
    String(item.updatedAt),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowMappingViews(items: WindowMapping[]): WindowMappingView[] {
  const views: WindowMappingView[] = [];
  for (const item of items) {
    views.push(toWindowMappingView(item));
  }
  return views;
}

export function sumWindowMappingView(view: WindowMappingView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBudget + parsedStartsAt + parsedPriority;
}
