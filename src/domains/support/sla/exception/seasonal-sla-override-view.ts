import * as text from "../../../../kit/text.js";
import { SeasonalSlaOverride } from "./seasonal-sla-override.js";

/** How screens and exports show a seasonal sla override. */
export class SeasonalSlaOverrideView {
  code: string;
  label: string;
  sequence: string;
  summary: string;
  ownerIdText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequence: string,
    summary: string,
    ownerIdText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.summary = summary;
    this.ownerIdText = ownerIdText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSlaOverrideView(item: SeasonalSlaOverride): SeasonalSlaOverrideView {
  return new SeasonalSlaOverrideView(
    item.code,
    text.truncate(item.label, 80),
    String(item.sequence),
    text.truncate(item.summary, 64),
    item.ownerId,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSlaOverrideViews(items: SeasonalSlaOverride[]): SeasonalSlaOverrideView[] {
  const views: SeasonalSlaOverrideView[] = [];
  for (const item of items) {
    views.push(toSeasonalSlaOverrideView(item));
  }
  return views;
}

export function sumSeasonalSlaOverrideView(view: SeasonalSlaOverrideView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedSequence + parsedUpdatedAt;
}
