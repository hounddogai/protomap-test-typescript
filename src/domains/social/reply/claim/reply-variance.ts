import * as text from "../../../../kit/text.js";

/** Where a reply variance is in its life cycle. */
export type ReplyVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reply variance as the reply team keeps it. */
export class ReplyVariance {
  code: string;
  name: string;
  bid: number;
  priority: number;
  endsAt: number;
  cohort: string;
  ownerId: string;
  revision: number;
  status: ReplyVarianceStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    priority: number,
    endsAt: number,
    cohort: string,
    ownerId: string,
    revision: number,
    status: ReplyVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.priority = priority;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.ownerId = ownerId;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ReplyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.bid - this.revision) * 100) / 100;
  }

  copy(): ReplyVariance {
    return new ReplyVariance(
      this.code,
      this.name,
      this.bid,
      this.priority,
      this.endsAt,
      this.cohort,
      this.ownerId,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reply variance in status proposed. */
export function newReplyVariance(code: string, name: string): ReplyVariance {
  return new ReplyVariance(code, name, 0, 0, 0, "", "", 0, "proposed");
}
