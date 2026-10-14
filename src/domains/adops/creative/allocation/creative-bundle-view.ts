import * as text from "../../../../kit/text.js";
import { CreativeBundle } from "./creative-bundle.js";

/** How screens and exports show a creative bundle. */
export class CreativeBundleView {
  code: string;
  nameText: string;
  bid: string;
  cohortText: string;
  locale: string;
  notes: string;
  archived: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    bid: string,
    cohortText: string,
    locale: string,
    notes: string,
    archived: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.bid = bid;
    this.cohortText = cohortText;
    this.locale = locale;
    this.notes = notes;
    this.archived = archived;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeBundleView(item: CreativeBundle): CreativeBundleView {
  return new CreativeBundleView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 40),
    item.bid.toFixed(2),
    item.cohort,
    item.locale,
    item.notes,
    `${item.archived}`,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeBundleViews(items: CreativeBundle[]): CreativeBundleView[] {
  const views: CreativeBundleView[] = [];
  for (const item of items) {
    views.push(toCreativeBundleView(item));
  }
  return views;
}

export function sumCreativeBundleView(view: CreativeBundleView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBid + parsedCreatedAt;
}
