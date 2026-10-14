/**
 * The lenient sla review records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient sla review is in its life cycle. */
export type LenientSlaReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient sla review as the sla team keeps it. */
export class LenientSlaReview {
  code: string;
  title: string;
  budget: number;
  ratio: number;
  source: string;
  checksum: string;
  version: number;
  status: LenientSlaReviewStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    ratio: number,
    source: string,
    checksum: string,
    version: number,
    status: LenientSlaReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.ratio = ratio;
    this.source = source;
    this.checksum = checksum;
    this.version = version;
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

  canMoveTo(next: LenientSlaReviewStatus): boolean {
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

  moveTo(next: LenientSlaReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sla review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.ratio * this.budget * 100) / 100;
  }

  copy(): LenientSlaReview {
    return new LenientSlaReview(
      this.code,
      this.title,
      this.budget,
      this.ratio,
      this.source,
      this.checksum,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient sla review in status requested. */
export function newLenientSlaReview(code: string, title: string): LenientSlaReview {
  return new LenientSlaReview(code, title, 0, 0, "", "", 0, "requested");
}
