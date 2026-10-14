import * as text from "../../../../kit/text.js";

/** Where a reward tier is in its life cycle. */
export type RewardTierStatus = "requested" | "granted" | "revoked" | "expired";

/** A reward tier. Its code is unique within a tenant. */
export class RewardTier {
  code: string;
  name: string;
  country: string;
  timezone: string;
  rate: number;
  description: string;
  margin: number;
  status: RewardTierStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    timezone: string,
    rate: number,
    description: string,
    margin: number,
    status: RewardTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.timezone = timezone;
    this.rate = rate;
    this.description = description;
    this.margin = margin;
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

  canMoveTo(next: RewardTierStatus): boolean {
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
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward tier"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.rate - this.margin) * 100) / 100;
  }

  copy(): RewardTier {
    return new RewardTier(
      this.code,
      this.name,
      this.country,
      this.timezone,
      this.rate,
      this.description,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward tier in status requested. */
export function newRewardTier(code: string, name: string): RewardTier {
  return new RewardTier(code, name, "", "", 0, "", 0, "requested");
}
