import * as text from "../../../../kit/text.js";
import { CreativeManifest } from "./creative-manifest.js";

/** How screens and exports show a creative manifest. */
export class CreativeManifestView {
  code: string;
  nameText: string;
  audienceId: string;
  limit: string;
  segment: string;
  marginText: string;
  approved: string;
  costText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    audienceId: string,
    limit: string,
    segment: string,
    marginText: string,
    approved: string,
    costText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.audienceId = audienceId;
    this.limit = limit;
    this.segment = segment;
    this.marginText = marginText;
    this.approved = approved;
    this.costText = costText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeManifestView(item: CreativeManifest): CreativeManifestView {
  return new CreativeManifestView(
    text.truncate(item.code, 80),
    item.name,
    item.audienceId,
    String(item.limit),
    item.segment,
    item.margin.toFixed(2),
    `${item.approved}`,
    item.cost.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeManifestViews(items: CreativeManifest[]): CreativeManifestView[] {
  const views: CreativeManifestView[] = [];
  for (const item of items) {
    views.push(toCreativeManifestView(item));
  }
  return views;
}

export function sumCreativeManifestView(view: CreativeManifestView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedLimit + parsedMargin + parsedCost;
}
