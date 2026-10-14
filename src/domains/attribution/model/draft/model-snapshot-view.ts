import * as text from "../../../../kit/text.js";
import { ModelSnapshot } from "./model-snapshot.js";

/** How screens and exports show a model snapshot. */
export class ModelSnapshotView {
  codeText: string;
  label: string;
  limit: string;
  graceDays: string;
  description: string;
  variant: string;
  timezoneText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    limit: string,
    graceDays: string,
    description: string,
    variant: string,
    timezoneText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.limit = limit;
    this.graceDays = graceDays;
    this.description = description;
    this.variant = variant;
    this.timezoneText = timezoneText;
    this.statusLabel = statusLabel;
  }
}

export function toModelSnapshotView(item: ModelSnapshot): ModelSnapshotView {
  return new ModelSnapshotView(
    text.truncate(item.code, 80),
    item.label,
    String(item.limit),
    String(item.graceDays),
    item.description,
    item.variant,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelSnapshotViews(items: ModelSnapshot[]): ModelSnapshotView[] {
  const views: ModelSnapshotView[] = [];
  for (const item of items) {
    views.push(toModelSnapshotView(item));
  }
  return views;
}

export function sumModelSnapshotView(view: ModelSnapshotView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedLimit + parsedGraceDays;
}
