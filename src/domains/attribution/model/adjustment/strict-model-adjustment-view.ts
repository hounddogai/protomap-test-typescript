import * as text from "../../../../kit/text.js";
import { StrictModelAdjustment } from "./strict-model-adjustment.js";

/** How screens and exports show a strict model adjustment. */
export class StrictModelAdjustmentView {
  code: string;
  name: string;
  floorValueText: string;
  sendAtText: string;
  endsAt: string;
  score: string;
  phoneText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValueText: string,
    sendAtText: string,
    endsAt: string,
    score: string,
    phoneText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValueText = floorValueText;
    this.sendAtText = sendAtText;
    this.endsAt = endsAt;
    this.score = score;
    this.phoneText = phoneText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictModelAdjustmentView(item: StrictModelAdjustment): StrictModelAdjustmentView {
  return new StrictModelAdjustmentView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    String(item.sendAt),
    String(item.endsAt),
    item.score.toFixed(2),
    text.truncate(item.phone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictModelAdjustmentViews(items: StrictModelAdjustment[]): StrictModelAdjustmentView[] {
  const views: StrictModelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toStrictModelAdjustmentView(item));
  }
  return views;
}

export function sumStrictModelAdjustmentView(view: StrictModelAdjustmentView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedFloorValue + parsedSendAt + parsedEndsAt;
}
