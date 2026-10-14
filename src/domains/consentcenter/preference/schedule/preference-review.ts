import * as text from "../../../../kit/text.js";

/** Where a preference review is in its life cycle. */
export type PreferenceReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a preference review and its current status. */
export class PreferenceReview {
  code: string;
  title: string;
  label: string;
  threshold: number;
  notes: string;
  pinned: boolean;
  contactEmail: string;
  status: PreferenceReviewStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    threshold: number,
    notes: string,
    pinned: boolean,
    contactEmail: string,
    status: PreferenceReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.threshold = threshold;
    this.notes = notes;
    this.pinned = pinned;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PreferenceReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"preference review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): PreferenceReview {
    return new PreferenceReview(
      this.code,
      this.title,
      this.label,
      this.threshold,
      this.notes,
      this.pinned,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a preference review in status draft. */
export function newPreferenceReview(code: string, title: string): PreferenceReview {
  return new PreferenceReview(code, title, "", 0, "", false, "", "draft");
}
