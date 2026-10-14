import * as text from "../../../../kit/text.js";
import { FraudCheckTemplate } from "./fraud-check-template.js";

/** How screens and exports show a fraud check template. */
export class FraudCheckTemplateView {
  code: string;
  label: string;
  floorValue: string;
  sendAtText: string;
  startsAtText: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    sendAtText: string,
    startsAtText: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.sendAtText = sendAtText;
    this.startsAtText = startsAtText;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckTemplateView(item: FraudCheckTemplate): FraudCheckTemplateView {
  return new FraudCheckTemplateView(
    text.truncate(item.code, 80),
    item.label,
    item.floorValue.toFixed(2),
    String(item.sendAt),
    String(item.startsAt),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckTemplateViews(items: FraudCheckTemplate[]): FraudCheckTemplateView[] {
  const views: FraudCheckTemplateView[] = [];
  for (const item of items) {
    views.push(toFraudCheckTemplateView(item));
  }
  return views;
}

export function sumFraudCheckTemplateView(view: FraudCheckTemplateView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedFloorValue + parsedSendAt + parsedStartsAt;
}
