import * as text from "../../../../kit/text.js";

/** Where a rolling fraud check tier is in its life cycle. */
export type RollingFraudCheckTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling fraud check tier. Its code is unique within a tenant. */
export class RollingFraudCheckTier {
  code: string;
  name: string;
  category: string;
  score: number;
  graceDays: number;
  sendAt: number;
  country: string;
  discount: number;
  ceiling: number;
  version: number;
  status: RollingFraudCheckTierStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    score: number,
    graceDays: number,
    sendAt: number,
    country: string,
    discount: number,
    ceiling: number,
    version: number,
    status: RollingFraudCheckTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.score = score;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.country = country;
    this.discount = discount;
    this.ceiling = ceiling;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingFraudCheckTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingFraudCheckTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling fraud check tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round((this.graceDays + this.sendAt) * 100) / 100;
  }

  copy(): RollingFraudCheckTier {
    return new RollingFraudCheckTier(
      this.code,
      this.name,
      this.category,
      this.score,
      this.graceDays,
      this.sendAt,
      this.country,
      this.discount,
      this.ceiling,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling fraud check tier in status new. */
export function newRollingFraudCheckTier(code: string, name: string): RollingFraudCheckTier {
  return new RollingFraudCheckTier(code, name, "", 0, 0, 0, "", 0, 0, 0, "new");
}
