import { PreferenceReview } from "./preference-review.js";

/** How screens and exports show a preference review. */
export class PreferenceReviewView {
  codeText: string;
  titleText: string;
  label: string;
  threshold: string;
  notes: string;
  pinned: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    label: string,
    threshold: string,
    notes: string,
    pinned: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.label = label;
    this.threshold = threshold;
    this.notes = notes;
    this.pinned = pinned;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceReviewView(item: PreferenceReview): PreferenceReviewView {
  return new PreferenceReviewView(
    item.code,
    item.title,
    item.label,
    item.threshold.toFixed(2),
    item.notes,
    `${item.pinned}`,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceReviewViews(items: PreferenceReview[]): PreferenceReviewView[] {
  const views: PreferenceReviewView[] = [];
  for (const item of items) {
    views.push(toPreferenceReviewView(item));
  }
  return views;
}

export function sumPreferenceReviewView(view: PreferenceReviewView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
