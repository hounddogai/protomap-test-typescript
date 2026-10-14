/**
 * The reply request records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply request is in its life cycle. */
export type ReplyRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reply request. Its code is unique within a tenant. */
export class ReplyRequest {
  code: string;
  title: string;
  currency: string;
  rate: number;
  bid: number;
  quantity: number;
  variant: string;
  status: ReplyRequestStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    rate: number,
    bid: number,
    quantity: number,
    variant: string,
    status: ReplyRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.rate = rate;
    this.bid = bid;
    this.quantity = quantity;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyRequestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.bid - this.quantity) * 100) / 100;
  }

  copy(): ReplyRequest {
    return new ReplyRequest(
      this.code,
      this.title,
      this.currency,
      this.rate,
      this.bid,
      this.quantity,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reply request in status new. */
export function newReplyRequest(code: string, title: string): ReplyRequest {
  return new ReplyRequest(code, title, "", 0, 0, 0, "", "new");
}
