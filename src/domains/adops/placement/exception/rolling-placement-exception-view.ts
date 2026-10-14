import * as text from "../../../../kit/text.js";
import { RollingPlacementException } from "./rolling-placement-exception.js";

/** How screens and exports show a rolling placement exception. */
export class RollingPlacementExceptionView {
  code: string;
  name: string;
  channel: string;
  batchSize: string;
  ownerId: string;
  utmSource: string;
  margin: string;
  conversionRate: string;
  retries: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channel: string,
    batchSize: string,
    ownerId: string,
    utmSource: string,
    margin: string,
    conversionRate: string,
    retries: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.retries = retries;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPlacementExceptionView(item: RollingPlacementException): RollingPlacementExceptionView {
  return new RollingPlacementExceptionView(
    item.code,
    item.name,
    text.truncate(item.channel, 80),
    String(item.batchSize),
    item.ownerId,
    item.utmSource,
    item.margin.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.retries),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPlacementExceptionViews(items: RollingPlacementException[]): RollingPlacementExceptionView[] {
  const views: RollingPlacementExceptionView[] = [];
  for (const item of items) {
    views.push(toRollingPlacementExceptionView(item));
  }
  return views;
}

export function sumRollingPlacementExceptionView(view: RollingPlacementExceptionView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBatchSize + parsedMargin + parsedConversionRate;
}
