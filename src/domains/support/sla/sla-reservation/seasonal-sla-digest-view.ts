import * as text from "../../../../kit/text.js";
import { SeasonalSlaDigest } from "./seasonal-sla-digest.js";

/** How screens and exports show a seasonal sla digest. */
export class SeasonalSlaDigestView {
  codeText: string;
  name: string;
  descriptionText: string;
  quantity: string;
  channel: string;
  checksumText: string;
  notes: string;
  unit: string;
  audienceId: string;
  cost: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    descriptionText: string,
    quantity: string,
    channel: string,
    checksumText: string,
    notes: string,
    unit: string,
    audienceId: string,
    cost: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.descriptionText = descriptionText;
    this.quantity = quantity;
    this.channel = channel;
    this.checksumText = checksumText;
    this.notes = notes;
    this.unit = unit;
    this.audienceId = audienceId;
    this.cost = cost;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSlaDigestView(item: SeasonalSlaDigest): SeasonalSlaDigestView {
  return new SeasonalSlaDigestView(
    item.code,
    item.name,
    item.description,
    String(item.quantity),
    item.channel,
    item.checksum,
    item.notes,
    item.unit,
    item.audienceId,
    item.cost.toFixed(2),
    text.truncate(item.source, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSlaDigestViews(items: SeasonalSlaDigest[]): SeasonalSlaDigestView[] {
  const views: SeasonalSlaDigestView[] = [];
  for (const item of items) {
    views.push(toSeasonalSlaDigestView(item));
  }
  return views;
}

export function sumSeasonalSlaDigestView(view: SeasonalSlaDigestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedQuantity + parsedCost;
}
