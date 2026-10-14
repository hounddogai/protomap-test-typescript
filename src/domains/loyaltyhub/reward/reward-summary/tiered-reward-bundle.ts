import * as text from "../../../../kit/text.js";

/** Where a tiered reward bundle is in its life cycle. */
export type TieredRewardBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered reward bundle as the reward team keeps it. */
export class TieredRewardBundle {
  code: string;
  name: string;
  phone: string;
  category: string;
  amount: number;
  retries: number;
  channel: string;
  country: string;
  pinned: boolean;
  endsAt: number;
  attempts: number;
  status: TieredRewardBundleStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    category: string,
    amount: number,
    retries: number,
    channel: string,
    country: string,
    pinned: boolean,
    endsAt: number,
    attempts: number,
    status: TieredRewardBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.category = category;
    this.amount = amount;
    this.retries = retries;
    this.channel = channel;
    this.country = country;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredRewardBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRewardBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.retries - this.endsAt) * 100) / 100;
  }

  copy(): TieredRewardBundle {
    return new TieredRewardBundle(
      this.code,
      this.name,
      this.phone,
      this.category,
      this.amount,
      this.retries,
      this.channel,
      this.country,
      this.pinned,
      this.endsAt,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered reward bundle in status open. */
export function newTieredRewardBundle(code: string, name: string): TieredRewardBundle {
  return new TieredRewardBundle(code, name, "", "", 0, 0, "", "", false, 0, 0, "open");
}
