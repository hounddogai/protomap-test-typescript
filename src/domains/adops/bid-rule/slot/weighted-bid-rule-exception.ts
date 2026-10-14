import * as text from "../../../../kit/text.js";

/** Where a weighted bid rule exception is in its life cycle. */
export type WeightedBidRuleExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted bid rule exception. Its code is unique within a tenant. */
export class WeightedBidRuleException {
  code: string;
  title: string;
  capacity: number;
  sendAt: number;
  name: string;
  source: string;
  phone: string;
  bid: number;
  status: WeightedBidRuleExceptionStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    sendAt: number,
    name: string,
    source: string,
    phone: string,
    bid: number,
    status: WeightedBidRuleExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.name = name;
    this.source = source;
    this.phone = phone;
    this.bid = bid;
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

  canMoveTo(next: WeightedBidRuleExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
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

  moveTo(next: WeightedBidRuleExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted bid rule exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted bid rule exception"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.bid + this.capacity) * 100) / 100;
  }

  copy(): WeightedBidRuleException {
    return new WeightedBidRuleException(
      this.code,
      this.title,
      this.capacity,
      this.sendAt,
      this.name,
      this.source,
      this.phone,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted bid rule exception in status requested. */
export function newWeightedBidRuleException(code: string, title: string): WeightedBidRuleException {
  return new WeightedBidRuleException(code, title, 0, 0, "", "", "", 0, "requested");
}
