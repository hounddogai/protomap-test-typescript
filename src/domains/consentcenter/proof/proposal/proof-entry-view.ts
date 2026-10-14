import { ProofEntry } from "./proof-entry.js";

/** How screens and exports show a proof entry. */
export class ProofEntryView {
  code: string;
  titleText: string;
  unit: string;
  discountText: string;
  revision: string;
  frequencyCapText: string;
  archived: string;
  pinned: string;
  visibleText: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    unit: string,
    discountText: string,
    revision: string,
    frequencyCapText: string,
    archived: string,
    pinned: string,
    visibleText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.unit = unit;
    this.discountText = discountText;
    this.revision = revision;
    this.frequencyCapText = frequencyCapText;
    this.archived = archived;
    this.pinned = pinned;
    this.visibleText = visibleText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toProofEntryView(item: ProofEntry): ProofEntryView {
  return new ProofEntryView(
    item.code,
    item.title,
    item.unit,
    item.discount.toFixed(2),
    String(item.revision),
    String(item.frequencyCap),
    `${item.archived}`,
    `${item.pinned}`,
    `${item.visible}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofEntryViews(items: ProofEntry[]): ProofEntryView[] {
  const views: ProofEntryView[] = [];
  for (const item of items) {
    views.push(toProofEntryView(item));
  }
  return views;
}

export function sumProofEntryView(view: ProofEntryView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedDiscount + parsedRevision + parsedFrequencyCap;
}
