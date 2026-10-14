import { JourneySlot } from "./journey-slot.js";

/** How screens and exports show a journey slot. */
export class JourneySlotView {
  codeText: string;
  name: string;
  ratioText: string;
  checksum: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ratioText: string,
    checksum: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ratioText = ratioText;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toJourneySlotView(item: JourneySlot): JourneySlotView {
  return new JourneySlotView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    item.checksum,
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneySlotViews(items: JourneySlot[]): JourneySlotView[] {
  const views: JourneySlotView[] = [];
  for (const item of items) {
    views.push(toJourneySlotView(item));
  }
  return views;
}

export function sumJourneySlotView(view: JourneySlotView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedRatio;
}
