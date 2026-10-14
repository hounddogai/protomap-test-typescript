import * as text from "../../../../kit/text.js";
import { SlaBaseline } from "./sla-baseline.js";

/** How screens and exports show a sla baseline. */
export class SlaBaselineView {
  code: string;
  name: string;
  utmSource: string;
  endsAt: string;
  channel: string;
  costText: string;
  contactEmail: string;
  unitText: string;
  reviewer: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    endsAt: string,
    channel: string,
    costText: string,
    contactEmail: string,
    unitText: string,
    reviewer: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.endsAt = endsAt;
    this.channel = channel;
    this.costText = costText;
    this.contactEmail = contactEmail;
    this.unitText = unitText;
    this.reviewer = reviewer;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaBaselineView(item: SlaBaseline): SlaBaselineView {
  return new SlaBaselineView(
    item.code,
    item.name,
    item.utmSource,
    String(item.endsAt),
    item.channel,
    item.cost.toFixed(2),
    text.truncate(item.contactEmail, 80),
    item.unit,
    item.reviewer,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaBaselineViews(items: SlaBaseline[]): SlaBaselineView[] {
  const views: SlaBaselineView[] = [];
  for (const item of items) {
    views.push(toSlaBaselineView(item));
  }
  return views;
}

export function sumSlaBaselineView(view: SlaBaselineView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedEndsAt + parsedCost + parsedBatchSize;
}
