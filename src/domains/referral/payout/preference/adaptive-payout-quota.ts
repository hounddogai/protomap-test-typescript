import * as text from "../../../../kit/text.js";

/** Where a adaptive payout quota is in its life cycle. */
export type AdaptivePayoutQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a adaptive payout quota and its current status. */
export class AdaptivePayoutQuota {
  code: string;
  label: string;
  rate: number;
  country: string;
  startsAt: number;
  ratio: number;
  budget: number;
  clicks: number;
  status: AdaptivePayoutQuotaStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    country: string,
    startsAt: number,
    ratio: number,
    budget: number,
    clicks: number,
    status: AdaptivePayoutQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.country = country;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.budget = budget;
    this.clicks = clicks;
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

  canMoveTo(next: AdaptivePayoutQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done";
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

  moveTo(next: AdaptivePayoutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive payout quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.clicks - this.ratio) * 100) / 100;
  }

  copy(): AdaptivePayoutQuota {
    return new AdaptivePayoutQuota(
      this.code,
      this.label,
      this.rate,
      this.country,
      this.startsAt,
      this.ratio,
      this.budget,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive payout quota in status new. */
export function newAdaptivePayoutQuota(code: string, label: string): AdaptivePayoutQuota {
  return new AdaptivePayoutQuota(code, label, 0, "", 0, 0, 0, 0, "new");
}
