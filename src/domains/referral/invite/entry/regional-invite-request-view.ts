import * as text from "../../../../kit/text.js";
import { RegionalInviteRequest } from "./regional-invite-request.js";

/** How screens and exports show a regional invite request. */
export class RegionalInviteRequestView {
  codeText: string;
  label: string;
  externalRefText: string;
  updatedAt: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    externalRefText: string,
    updatedAt: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.externalRefText = externalRefText;
    this.updatedAt = updatedAt;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalInviteRequestView(item: RegionalInviteRequest): RegionalInviteRequestView {
  return new RegionalInviteRequestView(
    item.code,
    item.label,
    text.truncate(item.externalRef, 40),
    String(item.updatedAt),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalInviteRequestViews(items: RegionalInviteRequest[]): RegionalInviteRequestView[] {
  const views: RegionalInviteRequestView[] = [];
  for (const item of items) {
    views.push(toRegionalInviteRequestView(item));
  }
  return views;
}

export function sumRegionalInviteRequestView(view: RegionalInviteRequestView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedUpdatedAt + parsedFloorValue;
}
