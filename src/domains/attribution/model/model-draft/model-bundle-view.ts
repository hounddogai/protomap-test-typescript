import * as text from "../../../../kit/text.js";
import { ModelBundle } from "./model-bundle.js";

/** How screens and exports show a model bundle. */
export class ModelBundleView {
  code: string;
  label: string;
  timezone: string;
  pinnedText: string;
  sequence: string;
  archived: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    pinnedText: string,
    sequence: string,
    archived: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.pinnedText = pinnedText;
    this.sequence = sequence;
    this.archived = archived;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toModelBundleView(item: ModelBundle): ModelBundleView {
  return new ModelBundleView(
    item.code,
    text.truncate(item.label, 80),
    item.timezone,
    `${item.pinned}`,
    String(item.sequence),
    `${item.archived}`,
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelBundleViews(items: ModelBundle[]): ModelBundleView[] {
  const views: ModelBundleView[] = [];
  for (const item of items) {
    views.push(toModelBundleView(item));
  }
  return views;
}

export function sumModelBundleView(view: ModelBundleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
