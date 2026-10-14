/**
 * The opt out review records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out review is in its life cycle. */
export type OptOutReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a opt out review and its current status. */
export class OptOutReview {
  code: string;
  title: string;
  impressions: number;
  region: string;
  openRate: number;
  priority: number;
  status: OptOutReviewStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    region: string,
    openRate: number,
    priority: number,
    status: OptOutReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.region = region;
    this.openRate = openRate;
    this.priority = priority;
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

  canMoveTo(next: OptOutReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: OptOutReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"opt out review"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.openRate + this.impressions) * 100) / 100;
  }

  copy(): OptOutReview {
    return new OptOutReview(
      this.code,
      this.title,
      this.impressions,
      this.region,
      this.openRate,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out review in status requested. */
export function newOptOutReview(code: string, title: string): OptOutReview {
  return new OptOutReview(code, title, 0, "", 0, 0, "requested");
}
