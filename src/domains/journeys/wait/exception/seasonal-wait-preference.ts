import * as text from "../../../../kit/text.js";

/** Where a seasonal wait preference is in its life cycle. */
export type SeasonalWaitPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal wait preference as the wait team keeps it. */
export class SeasonalWaitPreference {
  code: string;
  label: string;
  variant: string;
  rate: number;
  bid: number;
  sequence: number;
  reviewer: string;
  active: boolean;
  updatedAt: number;
  windowDays: number;
  checksum: string;
  status: SeasonalWaitPreferenceStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    rate: number,
    bid: number,
    sequence: number,
    reviewer: string,
    active: boolean,
    updatedAt: number,
    windowDays: number,
    checksum: string,
    status: SeasonalWaitPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.rate = rate;
    this.bid = bid;
    this.sequence = sequence;
    this.reviewer = reviewer;
    this.active = active;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.checksum = checksum;
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

  canMoveTo(next: SeasonalWaitPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalWaitPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal wait preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round(this.rate * this.bid * 100) / 100;
  }

  copy(): SeasonalWaitPreference {
    return new SeasonalWaitPreference(
      this.code,
      this.label,
      this.variant,
      this.rate,
      this.bid,
      this.sequence,
      this.reviewer,
      this.active,
      this.updatedAt,
      this.windowDays,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal wait preference in status idle. */
export function newSeasonalWaitPreference(code: string, label: string): SeasonalWaitPreference {
  return new SeasonalWaitPreference(code, label, "", 0, 0, 0, "", false, 0, 0, "", "idle");
}
