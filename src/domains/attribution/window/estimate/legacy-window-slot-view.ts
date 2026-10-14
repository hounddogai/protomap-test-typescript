import { LegacyWindowSlot } from "./legacy-window-slot.js";

/** How screens and exports show a legacy window slot. */
export class LegacyWindowSlotView {
  codeText: string;
  title: string;
  visible: string;
  rate: string;
  countryText: string;
  sequence: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    visible: string,
    rate: string,
    countryText: string,
    sequence: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.visible = visible;
    this.rate = rate;
    this.countryText = countryText;
    this.sequence = sequence;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWindowSlotView(item: LegacyWindowSlot): LegacyWindowSlotView {
  return new LegacyWindowSlotView(
    item.code,
    item.title,
    `${item.visible}`,
    item.rate.toFixed(2),
    item.country,
    String(item.sequence),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWindowSlotViews(items: LegacyWindowSlot[]): LegacyWindowSlotView[] {
  const views: LegacyWindowSlotView[] = [];
  for (const item of items) {
    views.push(toLegacyWindowSlotView(item));
  }
  return views;
}

export function sumLegacyWindowSlotView(view: LegacyWindowSlotView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedRate + parsedSequence;
}
