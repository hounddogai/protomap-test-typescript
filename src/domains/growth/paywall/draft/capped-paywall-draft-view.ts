import { CappedPaywallDraft } from "./capped-paywall-draft.js";

/** How screens and exports show a capped paywall draft. */
export class CappedPaywallDraftView {
  code: string;
  titleText: string;
  pinned: string;
  windowDaysText: string;
  revisionText: string;
  updatedAt: string;
  margin: string;
  frequencyCapText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinned: string,
    windowDaysText: string,
    revisionText: string,
    updatedAt: string,
    margin: string,
    frequencyCapText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinned = pinned;
    this.windowDaysText = windowDaysText;
    this.revisionText = revisionText;
    this.updatedAt = updatedAt;
    this.margin = margin;
    this.frequencyCapText = frequencyCapText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPaywallDraftView(item: CappedPaywallDraft): CappedPaywallDraftView {
  return new CappedPaywallDraftView(
    item.code,
    item.title,
    `${item.pinned}`,
    String(item.windowDays),
    String(item.revision),
    String(item.updatedAt),
    item.margin.toFixed(2),
    String(item.frequencyCap),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPaywallDraftViews(items: CappedPaywallDraft[]): CappedPaywallDraftView[] {
  const views: CappedPaywallDraftView[] = [];
  for (const item of items) {
    views.push(toCappedPaywallDraftView(item));
  }
  return views;
}

export function sumCappedPaywallDraftView(view: CappedPaywallDraftView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWindowDays + parsedRevision + parsedUpdatedAt;
}
