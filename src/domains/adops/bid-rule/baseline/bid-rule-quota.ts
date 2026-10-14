import * as text from "../../../../kit/text.js";

/** Where a bid rule quota is in its life cycle. */
export type BidRuleQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A bid rule quota as the bid rule team keeps it. */
export class BidRuleQuota {
  code: string;
  title: string;
  timezone: string;
  weight: number;
  impressions: number;
  version: number;
  attempts: number;
  audienceId: string;
  endsAt: number;
  sequence: number;
  status: BidRuleQuotaStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    weight: number,
    impressions: number,
    version: number,
    attempts: number,
    audienceId: string,
    endsAt: number,
    sequence: number,
    status: BidRuleQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.weight = weight;
    this.impressions = impressions;
    this.version = version;
    this.attempts = attempts;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BidRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.weight + this.version) * 100) / 100;
  }

  copy(): BidRuleQuota {
    return new BidRuleQuota(
      this.code,
      this.title,
      this.timezone,
      this.weight,
      this.impressions,
      this.version,
      this.attempts,
      this.audienceId,
      this.endsAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bid rule quota in status idle. */
export function newBidRuleQuota(code: string, title: string): BidRuleQuota {
  return new BidRuleQuota(code, title, "", 0, 0, 0, 0, "", 0, 0, "idle");
}
