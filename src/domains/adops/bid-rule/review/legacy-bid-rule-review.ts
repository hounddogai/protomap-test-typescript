/**
 * The legacy bid rule review records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy bid rule review is in its life cycle. */
export type LegacyBidRuleReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a legacy bid rule review and its current status. */
export class LegacyBidRuleReview {
  code: string;
  label: string;
  ceiling: number;
  frequencyCap: number;
  sequence: number;
  locale: string;
  contactEmail: string;
  threshold: number;
  pinned: boolean;
  audienceId: string;
  updatedAt: number;
  status: LegacyBidRuleReviewStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    frequencyCap: number,
    sequence: number,
    locale: string,
    contactEmail: string,
    threshold: number,
    pinned: boolean,
    audienceId: string,
    updatedAt: number,
    status: LegacyBidRuleReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyBidRuleReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyBidRuleReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy bid rule review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.ceiling * this.threshold * 100) / 100;
  }

  copy(): LegacyBidRuleReview {
    return new LegacyBidRuleReview(
      this.code,
      this.label,
      this.ceiling,
      this.frequencyCap,
      this.sequence,
      this.locale,
      this.contactEmail,
      this.threshold,
      this.pinned,
      this.audienceId,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy bid rule review in status open. */
export function newLegacyBidRuleReview(code: string, label: string): LegacyBidRuleReview {
  return new LegacyBidRuleReview(code, label, 0, 0, 0, "", "", 0, false, "", 0, "open");
}
