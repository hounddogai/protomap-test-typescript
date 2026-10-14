import * as text from "../../../../kit/text.js";

/** Where a reply claim is in its life cycle. */
export type ReplyClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reply claim as the reply team keeps it. */
export class ReplyClaim {
  code: string;
  name: string;
  journeyId: string;
  bid: number;
  channel: string;
  updatedAt: number;
  ceiling: number;
  variant: string;
  threshold: number;
  budget: number;
  version: number;
  status: ReplyClaimStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    bid: number,
    channel: string,
    updatedAt: number,
    ceiling: number,
    variant: string,
    threshold: number,
    budget: number,
    version: number,
    status: ReplyClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.bid = bid;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.variant = variant;
    this.threshold = threshold;
    this.budget = budget;
    this.version = version;
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

  canMoveTo(next: ReplyClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ReplyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.bid + this.ceiling) * 100) / 100;
  }

  copy(): ReplyClaim {
    return new ReplyClaim(
      this.code,
      this.name,
      this.journeyId,
      this.bid,
      this.channel,
      this.updatedAt,
      this.ceiling,
      this.variant,
      this.threshold,
      this.budget,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reply claim in status planned. */
export function newReplyClaim(code: string, name: string): ReplyClaim {
  return new ReplyClaim(code, name, "", 0, "", 0, 0, "", 0, 0, 0, "planned");
}
