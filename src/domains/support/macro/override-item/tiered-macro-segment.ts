import * as text from "../../../../kit/text.js";

/** Where a tiered macro segment is in its life cycle. */
export type TieredMacroSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tiered macro segment and its current status. */
export class TieredMacroSegment {
  code: string;
  label: string;
  capacity: number;
  currency: string;
  clicks: number;
  archived: boolean;
  unit: string;
  graceDays: number;
  impressions: number;
  status: TieredMacroSegmentStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    currency: string,
    clicks: number,
    archived: boolean,
    unit: string,
    graceDays: number,
    impressions: number,
    status: TieredMacroSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.currency = currency;
    this.clicks = clicks;
    this.archived = archived;
    this.unit = unit;
    this.graceDays = graceDays;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredMacroSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredMacroSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered macro segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.graceDays * this.capacity * 100) / 100;
  }

  copy(): TieredMacroSegment {
    return new TieredMacroSegment(
      this.code,
      this.label,
      this.capacity,
      this.currency,
      this.clicks,
      this.archived,
      this.unit,
      this.graceDays,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered macro segment in status open. */
export function newTieredMacroSegment(code: string, label: string): TieredMacroSegment {
  return new TieredMacroSegment(code, label, 0, "", 0, false, "", 0, 0, "open");
}
