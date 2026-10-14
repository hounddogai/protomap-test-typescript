import * as text from "../../../../kit/text.js";

/** Where a redemption claim is in its life cycle. */
export type RedemptionClaimStatus = "created" | "validated" | "published" | "retired";

/** A redemption claim as the redemption team keeps it. */
export class RedemptionClaim {
  code: string;
  label: string;
  limit: number;
  channel: string;
  attempts: number;
  endsAt: number;
  minimum: number;
  quantity: number;
  conversionRate: number;
  clicks: number;
  graceDays: number;
  status: RedemptionClaimStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    channel: string,
    attempts: number,
    endsAt: number,
    minimum: number,
    quantity: number,
    conversionRate: number,
    clicks: number,
    graceDays: number,
    status: RedemptionClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.channel = channel;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.minimum = minimum;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RedemptionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"redemption claim"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.clicks - this.conversionRate) * 100) / 100;
  }

  copy(): RedemptionClaim {
    return new RedemptionClaim(
      this.code,
      this.label,
      this.limit,
      this.channel,
      this.attempts,
      this.endsAt,
      this.minimum,
      this.quantity,
      this.conversionRate,
      this.clicks,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a redemption claim in status created. */
export function newRedemptionClaim(code: string, label: string): RedemptionClaim {
  return new RedemptionClaim(code, label, 0, "", 0, 0, 0, 0, 0, 0, 0, "created");
}
