import * as text from "../../../../kit/text.js";

/** Where a tiered redemption group is in its life cycle. */
export type TieredRedemptionGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered redemption group. Its code is unique within a tenant. */
export class TieredRedemptionGroup {
  code: string;
  title: string;
  impressions: number;
  cost: number;
  minimum: number;
  journeyId: string;
  reviewer: string;
  status: TieredRedemptionGroupStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    cost: number,
    minimum: number,
    journeyId: string,
    reviewer: string,
    status: TieredRedemptionGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.cost = cost;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
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

  canMoveTo(next: TieredRedemptionGroupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRedemptionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered redemption group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered redemption group"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.impressions * this.minimum * 100) / 100;
  }

  copy(): TieredRedemptionGroup {
    return new TieredRedemptionGroup(
      this.code,
      this.title,
      this.impressions,
      this.cost,
      this.minimum,
      this.journeyId,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered redemption group in status new. */
export function newTieredRedemptionGroup(code: string, title: string): TieredRedemptionGroup {
  return new TieredRedemptionGroup(code, title, 0, 0, 0, "", "", "new");
}
