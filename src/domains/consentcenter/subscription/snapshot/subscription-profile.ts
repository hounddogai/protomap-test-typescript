import * as text from "../../../../kit/text.js";

/** Where a subscription profile is in its life cycle. */
export type SubscriptionProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A subscription profile as the subscription team keeps it. */
export class SubscriptionProfile {
  code: string;
  name: string;
  score: number;
  approved: boolean;
  unit: string;
  channel: string;
  rate: number;
  status: SubscriptionProfileStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    approved: boolean,
    unit: string,
    channel: string,
    rate: number,
    status: SubscriptionProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.approved = approved;
    this.unit = unit;
    this.channel = channel;
    this.rate = rate;
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

  canMoveTo(next: SubscriptionProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SubscriptionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"subscription profile"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.score * this.rate * 100) / 100;
  }

  copy(): SubscriptionProfile {
    return new SubscriptionProfile(
      this.code,
      this.name,
      this.score,
      this.approved,
      this.unit,
      this.channel,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a subscription profile in status requested. */
export function newSubscriptionProfile(code: string, name: string): SubscriptionProfile {
  return new SubscriptionProfile(code, name, 0, false, "", "", 0, "requested");
}
