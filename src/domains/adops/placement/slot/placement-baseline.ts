import * as text from "../../../../kit/text.js";

/** Where a placement baseline is in its life cycle. */
export type PlacementBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A placement baseline as the placement team keeps it. */
export class PlacementBaseline {
  code: string;
  label: string;
  timezone: string;
  bid: number;
  durationMinutes: number;
  retries: number;
  status: PlacementBaselineStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    bid: number,
    durationMinutes: number,
    retries: number,
    status: PlacementBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
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

  canMoveTo(next: PlacementBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.bid * this.durationMinutes * 100) / 100;
  }

  copy(): PlacementBaseline {
    return new PlacementBaseline(
      this.code,
      this.label,
      this.timezone,
      this.bid,
      this.durationMinutes,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a placement baseline in status proposed. */
export function newPlacementBaseline(code: string, label: string): PlacementBaseline {
  return new PlacementBaseline(code, label, "", 0, 0, 0, "proposed");
}
