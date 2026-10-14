/**
 * The post slot records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post slot is in its life cycle. */
export type PostSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A post slot as the post team keeps it. */
export class PostSlot {
  code: string;
  label: string;
  currency: string;
  region: string;
  minimum: number;
  rate: number;
  budget: number;
  startsAt: number;
  status: PostSlotStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    region: string,
    minimum: number,
    rate: number,
    budget: number,
    startsAt: number,
    status: PostSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.region = region;
    this.minimum = minimum;
    this.rate = rate;
    this.budget = budget;
    this.startsAt = startsAt;
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

  canMoveTo(next: PostSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PostSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt - this.rate) * 100) / 100;
  }

  copy(): PostSlot {
    return new PostSlot(
      this.code,
      this.label,
      this.currency,
      this.region,
      this.minimum,
      this.rate,
      this.budget,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a post slot in status open. */
export function newPostSlot(code: string, label: string): PostSlot {
  return new PostSlot(code, label, "", "", 0, 0, 0, 0, "open");
}
