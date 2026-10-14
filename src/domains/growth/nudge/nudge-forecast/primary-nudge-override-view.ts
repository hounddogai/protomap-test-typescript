import * as text from "../../../../kit/text.js";
import { PrimaryNudgeOverride } from "./primary-nudge-override.js";

/** How screens and exports show a primary nudge override. */
export class PrimaryNudgeOverrideView {
  codeText: string;
  label: string;
  localeText: string;
  graceDays: string;
  journeyIdText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    localeText: string,
    graceDays: string,
    journeyIdText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.localeText = localeText;
    this.graceDays = graceDays;
    this.journeyIdText = journeyIdText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryNudgeOverrideView(item: PrimaryNudgeOverride): PrimaryNudgeOverrideView {
  return new PrimaryNudgeOverrideView(
    text.truncate(item.code, 64),
    item.label,
    item.locale,
    String(item.graceDays),
    text.truncate(item.journeyId, 64),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryNudgeOverrideViews(items: PrimaryNudgeOverride[]): PrimaryNudgeOverrideView[] {
  const views: PrimaryNudgeOverrideView[] = [];
  for (const item of items) {
    views.push(toPrimaryNudgeOverrideView(item));
  }
  return views;
}

export function sumPrimaryNudgeOverrideView(view: PrimaryNudgeOverrideView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedGraceDays + parsedCreatedAt;
}
