import * as text from "../../../../kit/text.js";
import { LenientStepDigest } from "./lenient-step-digest.js";

/** How screens and exports show a lenient step digest. */
export class LenientStepDigestView {
  code: string;
  title: string;
  frequencyCap: string;
  windowDaysText: string;
  journeyId: string;
  visible: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    frequencyCap: string,
    windowDaysText: string,
    journeyId: string,
    visible: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.windowDaysText = windowDaysText;
    this.journeyId = journeyId;
    this.visible = visible;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toLenientStepDigestView(item: LenientStepDigest): LenientStepDigestView {
  return new LenientStepDigestView(
    text.truncate(item.code, 80),
    item.title,
    String(item.frequencyCap),
    String(item.windowDays),
    text.truncate(item.journeyId, 120),
    `${item.visible}`,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientStepDigestViews(items: LenientStepDigest[]): LenientStepDigestView[] {
  const views: LenientStepDigestView[] = [];
  for (const item of items) {
    views.push(toLenientStepDigestView(item));
  }
  return views;
}

export function sumLenientStepDigestView(view: LenientStepDigestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedFrequencyCap + parsedWindowDays;
}
