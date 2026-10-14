import * as text from "../../../../kit/text.js";

/** Where a rolling payout bundle is in its life cycle. */
export type RollingPayoutBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling payout bundle and its current status. */
export class RollingPayoutBundle {
  code: string;
  title: string;
  name: string;
  impressions: number;
  version: number;
  attempts: number;
  cost: number;
  currency: string;
  minimum: number;
  sequence: number;
  expiresAt: number;
  status: RollingPayoutBundleStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    impressions: number,
    version: number,
    attempts: number,
    cost: number,
    currency: string,
    minimum: number,
    sequence: number,
    expiresAt: number,
    status: RollingPayoutBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.impressions = impressions;
    this.version = version;
    this.attempts = attempts;
    this.cost = cost;
    this.currency = currency;
    this.minimum = minimum;
    this.sequence = sequence;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: RollingPayoutBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPayoutBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling payout bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"rolling payout bundle"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.minimum * this.version * 100) / 100;
  }

  copy(): RollingPayoutBundle {
    return new RollingPayoutBundle(
      this.code,
      this.title,
      this.name,
      this.impressions,
      this.version,
      this.attempts,
      this.cost,
      this.currency,
      this.minimum,
      this.sequence,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling payout bundle in status proposed. */
export function newRollingPayoutBundle(code: string, title: string): RollingPayoutBundle {
  return new RollingPayoutBundle(code, title, "", 0, 0, 0, 0, "", 0, 0, 0, "proposed");
}
