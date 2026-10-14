/**
 * The global window review records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global window review is in its life cycle. */
export type GlobalWindowReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A global window review. Its code is unique within a tenant. */
export class GlobalWindowReview {
  code: string;
  name: string;
  variant: string;
  approved: boolean;
  category: string;
  unit: string;
  limit: number;
  bid: number;
  channel: string;
  label: string;
  threshold: number;
  status: GlobalWindowReviewStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    approved: boolean,
    category: string,
    unit: string,
    limit: number,
    bid: number,
    channel: string,
    label: string,
    threshold: number,
    status: GlobalWindowReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.approved = approved;
    this.category = category;
    this.unit = unit;
    this.limit = limit;
    this.bid = bid;
    this.channel = channel;
    this.label = label;
    this.threshold = threshold;
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

  canMoveTo(next: GlobalWindowReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalWindowReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global window review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.threshold - this.limit) * 100) / 100;
  }

  copy(): GlobalWindowReview {
    return new GlobalWindowReview(
      this.code,
      this.name,
      this.variant,
      this.approved,
      this.category,
      this.unit,
      this.limit,
      this.bid,
      this.channel,
      this.label,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global window review in status requested. */
export function newGlobalWindowReview(code: string, name: string): GlobalWindowReview {
  return new GlobalWindowReview(code, name, "", false, "", "", 0, 0, "", "", 0, "requested");
}
