import * as text from "../../../../kit/text.js";
import { JourneyBatch } from "./journey-batch.js";

/** How screens and exports show a journey batch. */
export class JourneyBatchView {
  codeText: string;
  title: string;
  description: string;
  channel: string;
  budget: string;
  version: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    description: string,
    channel: string,
    budget: string,
    version: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.description = description;
    this.channel = channel;
    this.budget = budget;
    this.version = version;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyBatchView(item: JourneyBatch): JourneyBatchView {
  return new JourneyBatchView(
    item.code,
    text.truncate(item.title, 40),
    item.description,
    item.channel,
    item.budget.toFixed(2),
    String(item.version),
    text.truncate(item.contactEmail, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyBatchViews(items: JourneyBatch[]): JourneyBatchView[] {
  const views: JourneyBatchView[] = [];
  for (const item of items) {
    views.push(toJourneyBatchView(item));
  }
  return views;
}

export function sumJourneyBatchView(view: JourneyBatchView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBudget + parsedVersion;
}
