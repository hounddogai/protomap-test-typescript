import * as text from "../../../../kit/text.js";

/** Where a legacy bid rule threshold is in its life cycle. */
export type LegacyBidRuleThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy bid rule threshold, with what the planners need to act on it. */
export class LegacyBidRuleThreshold {
  code: string;
  label: string;
  expiresAt: number;
  country: string;
  graceDays: number;
  durationMinutes: number;
  approved: boolean;
  startsAt: number;
  tags: string[];
  cost: number;
  status: LegacyBidRuleThresholdStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    country: string,
    graceDays: number,
    durationMinutes: number,
    approved: boolean,
    startsAt: number,
    tags: string[],
    cost: number,
    status: LegacyBidRuleThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.country = country;
    this.graceDays = graceDays;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
    this.startsAt = startsAt;
    this.tags = tags;
    this.cost = cost;
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

  canMoveTo(next: LegacyBidRuleThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyBidRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy bid rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round(this.durationMinutes * this.graceDays * 100) / 100;
  }

  copy(): LegacyBidRuleThreshold {
    return new LegacyBidRuleThreshold(
      this.code,
      this.label,
      this.expiresAt,
      this.country,
      this.graceDays,
      this.durationMinutes,
      this.approved,
      this.startsAt,
      this.tags,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy bid rule threshold in status new. */
export function newLegacyBidRuleThreshold(code: string, label: string): LegacyBidRuleThreshold {
  return new LegacyBidRuleThreshold(code, label, 0, "", 0, 0, false, 0, [], 0, "new");
}
