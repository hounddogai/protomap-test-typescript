import * as text from "../../../../kit/text.js";
import { DefaultPreferenceNotice } from "./default-preference-notice.js";

/** How screens and exports show a default preference notice. */
export class DefaultPreferenceNoticeView {
  code: string;
  label: string;
  frequencyCap: string;
  segmentText: string;
  revisionText: string;
  contactEmail: string;
  floorValue: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    segmentText: string,
    revisionText: string,
    contactEmail: string,
    floorValue: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.segmentText = segmentText;
    this.revisionText = revisionText;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPreferenceNoticeView(item: DefaultPreferenceNotice): DefaultPreferenceNoticeView {
  return new DefaultPreferenceNoticeView(
    item.code,
    text.truncate(item.label, 40),
    String(item.frequencyCap),
    item.segment,
    String(item.revision),
    item.contactEmail,
    item.floorValue.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPreferenceNoticeViews(items: DefaultPreferenceNotice[]): DefaultPreferenceNoticeView[] {
  const views: DefaultPreferenceNoticeView[] = [];
  for (const item of items) {
    views.push(toDefaultPreferenceNoticeView(item));
  }
  return views;
}

export function sumDefaultPreferenceNoticeView(view: DefaultPreferenceNoticeView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedFrequencyCap + parsedRevision + parsedFloorValue;
}
