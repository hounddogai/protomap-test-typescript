import * as text from "../../../../kit/text.js";
import { PendingSlaOverride } from "./pending-sla-override.js";

/** How screens and exports show a pending sla override. */
export class PendingSlaOverrideView {
  code: string;
  nameText: string;
  category: string;
  floorValueText: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    category: string,
    floorValueText: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.category = category;
    this.floorValueText = floorValueText;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSlaOverrideView(item: PendingSlaOverride): PendingSlaOverrideView {
  return new PendingSlaOverrideView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 120),
    item.category,
    item.floorValue.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSlaOverrideViews(items: PendingSlaOverride[]): PendingSlaOverrideView[] {
  const views: PendingSlaOverrideView[] = [];
  for (const item of items) {
    views.push(toPendingSlaOverrideView(item));
  }
  return views;
}

export function sumPendingSlaOverrideView(view: PendingSlaOverrideView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedFloorValue;
}
