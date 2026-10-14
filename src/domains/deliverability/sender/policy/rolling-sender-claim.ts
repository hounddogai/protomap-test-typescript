import * as text from "../../../../kit/text.js";

/** Where a rolling sender claim is in its life cycle. */
export type RollingSenderClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling sender claim as the sender team keeps it. */
export class RollingSenderClaim {
  code: string;
  title: string;
  minimum: number;
  impressions: number;
  createdAt: number;
  version: number;
  openRate: number;
  rate: number;
  status: RollingSenderClaimStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    impressions: number,
    createdAt: number,
    version: number,
    openRate: number,
    rate: number,
    status: RollingSenderClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.impressions = impressions;
    this.createdAt = createdAt;
    this.version = version;
    this.openRate = openRate;
    this.rate = rate;
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

  canMoveTo(next: RollingSenderClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingSenderClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sender claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netExposure(): number {
    return Math.round(this.version * this.rate * 100) / 100;
  }

  copy(): RollingSenderClaim {
    return new RollingSenderClaim(
      this.code,
      this.title,
      this.minimum,
      this.impressions,
      this.createdAt,
      this.version,
      this.openRate,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling sender claim in status new. */
export function newRollingSenderClaim(code: string, title: string): RollingSenderClaim {
  return new RollingSenderClaim(code, title, 0, 0, 0, 0, 0, 0, "new");
}
