import * as text from "../../../../kit/text.js";
import { LegacyWindowDraft } from "./legacy-window-draft.js";

/** How screens and exports show a legacy window draft. */
export class LegacyWindowDraftView {
  code: string;
  name: string;
  visible: string;
  approved: string;
  batchSizeText: string;
  checksum: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    approved: string,
    batchSizeText: string,
    checksum: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.approved = approved;
    this.batchSizeText = batchSizeText;
    this.checksum = checksum;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWindowDraftView(item: LegacyWindowDraft): LegacyWindowDraftView {
  return new LegacyWindowDraftView(
    item.code,
    text.truncate(item.name, 64),
    `${item.visible}`,
    `${item.approved}`,
    String(item.batchSize),
    item.checksum,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWindowDraftViews(items: LegacyWindowDraft[]): LegacyWindowDraftView[] {
  const views: LegacyWindowDraftView[] = [];
  for (const item of items) {
    views.push(toLegacyWindowDraftView(item));
  }
  return views;
}

export function sumLegacyWindowDraftView(view: LegacyWindowDraftView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedBatchSize + parsedWindowDays;
}
