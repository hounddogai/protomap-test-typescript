import * as text from "../../../../kit/text.js";
import { WindowMetric } from "./window-metric.js";

/** How screens and exports show a window metric. */
export class WindowMetricView {
  code: string;
  nameText: string;
  version: string;
  weight: string;
  audienceIdText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    version: string,
    weight: string,
    audienceIdText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.version = version;
    this.weight = weight;
    this.audienceIdText = audienceIdText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toWindowMetricView(item: WindowMetric): WindowMetricView {
  return new WindowMetricView(
    text.truncate(item.code, 120),
    item.name,
    String(item.version),
    item.weight.toFixed(2),
    item.audienceId,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowMetricViews(items: WindowMetric[]): WindowMetricView[] {
  const views: WindowMetricView[] = [];
  for (const item of items) {
    views.push(toWindowMetricView(item));
  }
  return views;
}

export function sumWindowMetricView(view: WindowMetricView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedVersion + parsedWeight + parsedCapacity;
}
