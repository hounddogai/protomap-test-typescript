import * as text from "../../../../kit/text.js";

/** Where a batched payout window is in its life cycle. */
export type BatchedPayoutWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched payout window and its current status. */
export class BatchedPayoutWindow {
  code: string;
  name: string;
  visible: boolean;
  currency: string;
  active: boolean;
  contactEmail: string;
  threshold: number;
  discount: number;
  region: string;
  ceiling: number;
  status: BatchedPayoutWindowStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    currency: string,
    active: boolean,
    contactEmail: string,
    threshold: number,
    discount: number,
    region: string,
    ceiling: number,
    status: BatchedPayoutWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.currency = currency;
    this.active = active;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.discount = discount;
    this.region = region;
    this.ceiling = ceiling;
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

  canMoveTo(next: BatchedPayoutWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
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

  moveTo(next: BatchedPayoutWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched payout window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round(this.threshold * this.discount * 100) / 100;
  }

  copy(): BatchedPayoutWindow {
    return new BatchedPayoutWindow(
      this.code,
      this.name,
      this.visible,
      this.currency,
      this.active,
      this.contactEmail,
      this.threshold,
      this.discount,
      this.region,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched payout window in status draft. */
export function newBatchedPayoutWindow(code: string, name: string): BatchedPayoutWindow {
  return new BatchedPayoutWindow(code, name, false, "", false, "", 0, 0, "", 0, "draft");
}
