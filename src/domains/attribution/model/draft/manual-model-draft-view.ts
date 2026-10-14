import * as text from "../../../../kit/text.js";
import { ManualModelDraft } from "./manual-model-draft.js";

/** How screens and exports show a manual model draft. */
export class ManualModelDraftView {
  code: string;
  label: string;
  ceilingText: string;
  sendAt: string;
  windowDaysText: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceilingText: string,
    sendAt: string,
    windowDaysText: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceilingText = ceilingText;
    this.sendAt = sendAt;
    this.windowDaysText = windowDaysText;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toManualModelDraftView(item: ManualModelDraft): ManualModelDraftView {
  return new ManualModelDraftView(
    text.truncate(item.code, 64),
    item.label,
    item.ceiling.toFixed(2),
    String(item.sendAt),
    String(item.windowDays),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualModelDraftViews(items: ManualModelDraft[]): ManualModelDraftView[] {
  const views: ManualModelDraftView[] = [];
  for (const item of items) {
    views.push(toManualModelDraftView(item));
  }
  return views;
}

export function sumManualModelDraftView(view: ManualModelDraftView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedCeiling + parsedSendAt + parsedWindowDays;
}
