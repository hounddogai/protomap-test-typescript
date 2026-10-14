import * as text from "../../../../kit/text.js";
import { LenientInsightSlot } from "./lenient-insight-slot.js";

/** How screens and exports show a lenient insight slot. */
export class LenientInsightSlotView {
  codeText: string;
  titleText: string;
  localeText: string;
  nameText: string;
  visible: string;
  segmentText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    localeText: string,
    nameText: string,
    visible: string,
    segmentText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.localeText = localeText;
    this.nameText = nameText;
    this.visible = visible;
    this.segmentText = segmentText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientInsightSlotView(item: LenientInsightSlot): LenientInsightSlotView {
  return new LenientInsightSlotView(
    item.code,
    text.truncate(item.title, 40),
    item.locale,
    item.name,
    `${item.visible}`,
    item.segment,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientInsightSlotViews(items: LenientInsightSlot[]): LenientInsightSlotView[] {
  const views: LenientInsightSlotView[] = [];
  for (const item of items) {
    views.push(toLenientInsightSlotView(item));
  }
  return views;
}

export function sumLenientInsightSlotView(view: LenientInsightSlotView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
