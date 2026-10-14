/**
 * The mention review records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention review is in its life cycle. */
export type MentionReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One mention review, with what the planners need to act on it. */
export class MentionReview {
  code: string;
  label: string;
  category: string;
  openRate: number;
  floorValue: number;
  locale: string;
  retries: number;
  status: MentionReviewStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    openRate: number,
    floorValue: number,
    locale: string,
    retries: number,
    status: MentionReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.openRate = openRate;
    this.floorValue = floorValue;
    this.locale = locale;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MentionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round(this.floorValue * this.openRate * 100) / 100;
  }

  copy(): MentionReview {
    return new MentionReview(
      this.code,
      this.label,
      this.category,
      this.openRate,
      this.floorValue,
      this.locale,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a mention review in status requested. */
export function newMentionReview(code: string, label: string): MentionReview {
  return new MentionReview(code, label, "", 0, 0, "", 0, "requested");
}
