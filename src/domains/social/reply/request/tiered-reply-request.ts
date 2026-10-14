import * as text from "../../../../kit/text.js";

/** Where a tiered reply request is in its life cycle. */
export type TieredReplyRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a tiered reply request and its current status. */
export class TieredReplyRequest {
  code: string;
  title: string;
  channel: string;
  frequencyCap: number;
  threshold: number;
  sequence: number;
  currency: string;
  maximum: number;
  discount: number;
  retries: number;
  status: TieredReplyRequestStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    frequencyCap: number,
    threshold: number,
    sequence: number,
    currency: string,
    maximum: number,
    discount: number,
    retries: number,
    status: TieredReplyRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
    this.sequence = sequence;
    this.currency = currency;
    this.maximum = maximum;
    this.discount = discount;
    this.retries = retries;
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

  canMoveTo(next: TieredReplyRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredReplyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reply request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered reply request"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.sequence + this.frequencyCap) * 100) / 100;
  }

  copy(): TieredReplyRequest {
    return new TieredReplyRequest(
      this.code,
      this.title,
      this.channel,
      this.frequencyCap,
      this.threshold,
      this.sequence,
      this.currency,
      this.maximum,
      this.discount,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered reply request in status draft. */
export function newTieredReplyRequest(code: string, title: string): TieredReplyRequest {
  return new TieredReplyRequest(code, title, "", 0, 0, 0, "", 0, 0, 0, "draft");
}
