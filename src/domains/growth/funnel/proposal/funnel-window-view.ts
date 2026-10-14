import * as text from "../../../../kit/text.js";
import { FunnelWindow } from "./funnel-window.js";

/** How screens and exports show a funnel window. */
export class FunnelWindowView {
  codeText: string;
  name: string;
  budget: string;
  revision: string;
  version: string;
  utmSource: string;
  channel: string;
  reviewer: string;
  rate: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budget: string,
    revision: string,
    version: string,
    utmSource: string,
    channel: string,
    reviewer: string,
    rate: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budget = budget;
    this.revision = revision;
    this.version = version;
    this.utmSource = utmSource;
    this.channel = channel;
    this.reviewer = reviewer;
    this.rate = rate;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelWindowView(item: FunnelWindow): FunnelWindowView {
  return new FunnelWindowView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    String(item.revision),
    String(item.version),
    text.truncate(item.utmSource, 120),
    item.channel,
    item.reviewer,
    item.rate.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelWindowViews(items: FunnelWindow[]): FunnelWindowView[] {
  const views: FunnelWindowView[] = [];
  for (const item of items) {
    views.push(toFunnelWindowView(item));
  }
  return views;
}

export function sumFunnelWindowView(view: FunnelWindowView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBudget + parsedRevision + parsedVersion;
}
