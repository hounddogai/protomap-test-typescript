/**
 * The adaptive bounce notice records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive bounce notice is in its life cycle. */
export type AdaptiveBounceNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive bounce notice, with what the planners need to act on it. */
export class AdaptiveBounceNotice {
  code: string;
  name: string;
  bid: number;
  locale: string;
  capacity: number;
  threshold: number;
  quantity: number;
  status: AdaptiveBounceNoticeStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    locale: string,
    capacity: number,
    threshold: number,
    quantity: number,
    status: AdaptiveBounceNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.locale = locale;
    this.capacity = capacity;
    this.threshold = threshold;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptiveBounceNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBounceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive bounce notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.capacity - this.quantity) * 100) / 100;
  }

  copy(): AdaptiveBounceNotice {
    return new AdaptiveBounceNotice(
      this.code,
      this.name,
      this.bid,
      this.locale,
      this.capacity,
      this.threshold,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive bounce notice in status draft. */
export function newAdaptiveBounceNotice(code: string, name: string): AdaptiveBounceNotice {
  return new AdaptiveBounceNotice(code, name, 0, "", 0, 0, 0, "draft");
}
