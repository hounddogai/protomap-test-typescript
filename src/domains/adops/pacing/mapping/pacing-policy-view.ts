import * as text from "../../../../kit/text.js";
import { PacingPolicy } from "./pacing-policy.js";

/** How screens and exports show a pacing policy. */
export class PacingPolicyView {
  codeText: string;
  label: string;
  titleText: string;
  channel: string;
  expiresAtText: string;
  utmSourceText: string;
  reviewer: string;
  marginText: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    titleText: string,
    channel: string,
    expiresAtText: string,
    utmSourceText: string,
    reviewer: string,
    marginText: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.titleText = titleText;
    this.channel = channel;
    this.expiresAtText = expiresAtText;
    this.utmSourceText = utmSourceText;
    this.reviewer = reviewer;
    this.marginText = marginText;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toPacingPolicyView(item: PacingPolicy): PacingPolicyView {
  return new PacingPolicyView(
    item.code,
    item.label,
    item.title,
    text.truncate(item.channel, 40),
    String(item.expiresAt),
    item.utmSource,
    item.reviewer,
    item.margin.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingPolicyViews(items: PacingPolicy[]): PacingPolicyView[] {
  const views: PacingPolicyView[] = [];
  for (const item of items) {
    views.push(toPacingPolicyView(item));
  }
  return views;
}

export function sumPacingPolicyView(view: PacingPolicyView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedExpiresAt + parsedMargin + parsedFloorValue;
}
