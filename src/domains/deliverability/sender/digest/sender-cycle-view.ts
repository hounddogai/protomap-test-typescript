import * as text from "../../../../kit/text.js";
import { SenderCycle } from "./sender-cycle.js";

/** How screens and exports show a sender cycle. */
export class SenderCycleView {
  code: string;
  name: string;
  reviewer: string;
  openRate: string;
  archived: string;
  visibleText: string;
  description: string;
  unitText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    openRate: string,
    archived: string,
    visibleText: string,
    description: string,
    unitText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.archived = archived;
    this.visibleText = visibleText;
    this.description = description;
    this.unitText = unitText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toSenderCycleView(item: SenderCycle): SenderCycleView {
  return new SenderCycleView(
    text.truncate(item.code, 120),
    item.name,
    item.reviewer,
    item.openRate.toFixed(2),
    `${item.archived}`,
    `${item.visible}`,
    item.description,
    item.unit,
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderCycleViews(items: SenderCycle[]): SenderCycleView[] {
  const views: SenderCycleView[] = [];
  for (const item of items) {
    views.push(toSenderCycleView(item));
  }
  return views;
}

export function sumSenderCycleView(view: SenderCycleView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedOpenRate;
}
