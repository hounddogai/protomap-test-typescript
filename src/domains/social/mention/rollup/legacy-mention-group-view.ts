import * as text from "../../../../kit/text.js";
import { LegacyMentionGroup } from "./legacy-mention-group.js";

/** How screens and exports show a legacy mention group. */
export class LegacyMentionGroupView {
  code: string;
  label: string;
  costText: string;
  category: string;
  pinnedText: string;
  ownerId: string;
  name: string;
  minimumText: string;
  endsAtText: string;
  revisionText: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    costText: string,
    category: string,
    pinnedText: string,
    ownerId: string,
    name: string,
    minimumText: string,
    endsAtText: string,
    revisionText: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.costText = costText;
    this.category = category;
    this.pinnedText = pinnedText;
    this.ownerId = ownerId;
    this.name = name;
    this.minimumText = minimumText;
    this.endsAtText = endsAtText;
    this.revisionText = revisionText;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyMentionGroupView(item: LegacyMentionGroup): LegacyMentionGroupView {
  return new LegacyMentionGroupView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    text.truncate(item.category, 120),
    `${item.pinned}`,
    text.truncate(item.ownerId, 120),
    item.name,
    item.minimum.toFixed(2),
    String(item.endsAt),
    String(item.revision),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyMentionGroupViews(items: LegacyMentionGroup[]): LegacyMentionGroupView[] {
  const views: LegacyMentionGroupView[] = [];
  for (const item of items) {
    views.push(toLegacyMentionGroupView(item));
  }
  return views;
}

export function sumLegacyMentionGroupView(view: LegacyMentionGroupView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedCost + parsedMinimum + parsedEndsAt;
}
