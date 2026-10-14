import { LenientSubscriptionPreference } from "./lenient-subscription-preference.js";

/** How screens and exports show a lenient subscription preference. */
export class LenientSubscriptionPreferenceView {
  code: string;
  titleText: string;
  revisionText: string;
  approved: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revisionText: string,
    approved: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revisionText = revisionText;
    this.approved = approved;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSubscriptionPreferenceView(item: LenientSubscriptionPreference): LenientSubscriptionPreferenceView {
  return new LenientSubscriptionPreferenceView(
    item.code,
    item.title,
    String(item.revision),
    `${item.approved}`,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSubscriptionPreferenceViews(items: LenientSubscriptionPreference[]): LenientSubscriptionPreferenceView[] {
  const views: LenientSubscriptionPreferenceView[] = [];
  for (const item of items) {
    views.push(toLenientSubscriptionPreferenceView(item));
  }
  return views;
}

export function sumLenientSubscriptionPreferenceView(view: LenientSubscriptionPreferenceView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedRevision + parsedFrequencyCap;
}
