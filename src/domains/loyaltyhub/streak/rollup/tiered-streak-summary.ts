import * as text from "../../../../kit/text.js";

/** Where a tiered streak summary is in its life cycle. */
export type TieredStreakSummaryStatus = "created" | "validated" | "published" | "retired";

/** A tiered streak summary as the streak team keeps it. */
export class TieredStreakSummary {
  code: string;
  name: string;
  frequencyCap: number;
  openRate: number;
  expiresAt: number;
  version: number;
  limit: number;
  campaignRef: string;
  status: TieredStreakSummaryStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    openRate: number,
    expiresAt: number,
    version: number,
    limit: number,
    campaignRef: string,
    status: TieredStreakSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.expiresAt = expiresAt;
    this.version = version;
    this.limit = limit;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: TieredStreakSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: TieredStreakSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered streak summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.limit * this.version * 100) / 100;
  }

  copy(): TieredStreakSummary {
    return new TieredStreakSummary(
      this.code,
      this.name,
      this.frequencyCap,
      this.openRate,
      this.expiresAt,
      this.version,
      this.limit,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered streak summary in status created. */
export function newTieredStreakSummary(code: string, name: string): TieredStreakSummary {
  return new TieredStreakSummary(code, name, 0, 0, 0, 0, 0, "", "created");
}
