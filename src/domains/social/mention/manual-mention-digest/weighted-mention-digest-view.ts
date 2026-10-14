import { WeightedMentionDigest } from "./weighted-mention-digest.js";

/** How screens and exports show a weighted mention digest. */
export class WeightedMentionDigestView {
  code: string;
  title: string;
  notesText: string;
  ceilingText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    notesText: string,
    ceilingText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.notesText = notesText;
    this.ceilingText = ceilingText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedMentionDigestView(item: WeightedMentionDigest): WeightedMentionDigestView {
  return new WeightedMentionDigestView(
    item.code,
    item.title,
    item.notes,
    item.ceiling.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedMentionDigestViews(items: WeightedMentionDigest[]): WeightedMentionDigestView[] {
  const views: WeightedMentionDigestView[] = [];
  for (const item of items) {
    views.push(toWeightedMentionDigestView(item));
  }
  return views;
}

export function sumWeightedMentionDigestView(view: WeightedMentionDigestView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCeiling;
}
