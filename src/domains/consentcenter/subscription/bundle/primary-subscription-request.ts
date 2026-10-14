import * as text from "../../../../kit/text.js";

/** Where a primary subscription request is in its life cycle. */
export type PrimarySubscriptionRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary subscription request. Its code is unique within a tenant. */
export class PrimarySubscriptionRequest {
  code: string;
  name: string;
  bid: number;
  retries: number;
  reviewer: string;
  channel: string;
  amount: number;
  maximum: number;
  status: PrimarySubscriptionRequestStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    retries: number,
    reviewer: string,
    channel: string,
    amount: number,
    maximum: number,
    status: PrimarySubscriptionRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.retries = retries;
    this.reviewer = reviewer;
    this.channel = channel;
    this.amount = amount;
    this.maximum = maximum;
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

  canMoveTo(next: PrimarySubscriptionRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
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

  moveTo(next: PrimarySubscriptionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary subscription request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary subscription request"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.maximum - this.retries) * 100) / 100;
  }

  copy(): PrimarySubscriptionRequest {
    return new PrimarySubscriptionRequest(
      this.code,
      this.name,
      this.bid,
      this.retries,
      this.reviewer,
      this.channel,
      this.amount,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary subscription request in status draft. */
export function newPrimarySubscriptionRequest(code: string, name: string): PrimarySubscriptionRequest {
  return new PrimarySubscriptionRequest(code, name, 0, 0, "", "", 0, 0, "draft");
}
