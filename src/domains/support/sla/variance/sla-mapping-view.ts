import * as text from "../../../../kit/text.js";
import { SlaMapping } from "./sla-mapping.js";

/** How screens and exports show a sla mapping. */
export class SlaMappingView {
  code: string;
  name: string;
  version: string;
  segment: string;
  description: string;
  amount: string;
  channel: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    segment: string,
    description: string,
    amount: string,
    channel: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.segment = segment;
    this.description = description;
    this.amount = amount;
    this.channel = channel;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toSlaMappingView(item: SlaMapping): SlaMappingView {
  return new SlaMappingView(
    text.truncate(item.code, 40),
    item.name,
    String(item.version),
    item.segment,
    text.truncate(item.description, 64),
    item.amount.toFixed(2),
    item.channel,
    text.truncate(item.externalRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaMappingViews(items: SlaMapping[]): SlaMappingView[] {
  const views: SlaMappingView[] = [];
  for (const item of items) {
    views.push(toSlaMappingView(item));
  }
  return views;
}

export function sumSlaMappingView(view: SlaMappingView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedVersion + parsedAmount;
}
