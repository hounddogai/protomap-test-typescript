import * as text from "../../../../kit/text.js";
import { SlaAllocation } from "./sla-allocation.js";

/** How screens and exports show a sla allocation. */
export class SlaAllocationView {
  codeText: string;
  nameText: string;
  pinned: string;
  audienceId: string;
  attemptsText: string;
  priorityText: string;
  ceiling: string;
  bid: string;
  cost: string;
  windowDays: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    pinned: string,
    audienceId: string,
    attemptsText: string,
    priorityText: string,
    ceiling: string,
    bid: string,
    cost: string,
    windowDays: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.attemptsText = attemptsText;
    this.priorityText = priorityText;
    this.ceiling = ceiling;
    this.bid = bid;
    this.cost = cost;
    this.windowDays = windowDays;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaAllocationView(item: SlaAllocation): SlaAllocationView {
  return new SlaAllocationView(
    text.truncate(item.code, 120),
    item.name,
    `${item.pinned}`,
    item.audienceId,
    String(item.attempts),
    String(item.priority),
    item.ceiling.toFixed(2),
    item.bid.toFixed(2),
    item.cost.toFixed(2),
    String(item.windowDays),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaAllocationViews(items: SlaAllocation[]): SlaAllocationView[] {
  const views: SlaAllocationView[] = [];
  for (const item of items) {
    views.push(toSlaAllocationView(item));
  }
  return views;
}

export function sumSlaAllocationView(view: SlaAllocationView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedAttempts + parsedPriority + parsedCeiling;
}
