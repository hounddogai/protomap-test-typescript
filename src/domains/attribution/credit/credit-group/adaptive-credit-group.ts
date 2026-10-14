/**
 * The adaptive credit group records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive credit group is in its life cycle. */
export type AdaptiveCreditGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive credit group, with what the planners need to act on it. */
export class AdaptiveCreditGroup {
  code: string;
  title: string;
  approved: boolean;
  tags: string[];
  threshold: number;
  quantity: number;
  ceiling: number;
  contactEmail: string;
  currency: string;
  status: AdaptiveCreditGroupStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    tags: string[],
    threshold: number,
    quantity: number,
    ceiling: number,
    contactEmail: string,
    currency: string,
    status: AdaptiveCreditGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.tags = tags;
    this.threshold = threshold;
    this.quantity = quantity;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveCreditGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveCreditGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive credit group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round(this.ceiling * this.quantity * 100) / 100;
  }

  copy(): AdaptiveCreditGroup {
    return new AdaptiveCreditGroup(
      this.code,
      this.title,
      this.approved,
      this.tags,
      this.threshold,
      this.quantity,
      this.ceiling,
      this.contactEmail,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive credit group in status planned. */
export function newAdaptiveCreditGroup(code: string, title: string): AdaptiveCreditGroup {
  return new AdaptiveCreditGroup(code, title, false, [], 0, 0, 0, "", "", "planned");
}
