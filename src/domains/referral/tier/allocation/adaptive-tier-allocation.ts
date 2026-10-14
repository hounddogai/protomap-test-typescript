import * as text from "../../../../kit/text.js";

/** Where a adaptive tier allocation is in its life cycle. */
export type AdaptiveTierAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive tier allocation and its current status. */
export class AdaptiveTierAllocation {
  code: string;
  name: string;
  active: boolean;
  archived: boolean;
  startsAt: number;
  limit: number;
  impressions: number;
  ceiling: number;
  campaignRef: string;
  ratio: number;
  status: AdaptiveTierAllocationStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    archived: boolean,
    startsAt: number,
    limit: number,
    impressions: number,
    ceiling: number,
    campaignRef: string,
    ratio: number,
    status: AdaptiveTierAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.archived = archived;
    this.startsAt = startsAt;
    this.limit = limit;
    this.impressions = impressions;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
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

  canMoveTo(next: AdaptiveTierAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveTierAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive tier allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt + this.ceiling) * 100) / 100;
  }

  copy(): AdaptiveTierAllocation {
    return new AdaptiveTierAllocation(
      this.code,
      this.name,
      this.active,
      this.archived,
      this.startsAt,
      this.limit,
      this.impressions,
      this.ceiling,
      this.campaignRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive tier allocation in status proposed. */
export function newAdaptiveTierAllocation(code: string, name: string): AdaptiveTierAllocation {
  return new AdaptiveTierAllocation(code, name, false, false, 0, 0, 0, 0, "", 0, "proposed");
}
