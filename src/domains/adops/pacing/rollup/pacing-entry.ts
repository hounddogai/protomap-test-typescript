import * as text from "../../../../kit/text.js";

/** Where a pacing entry is in its life cycle. */
export type PacingEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pacing entry. Its code is unique within a tenant. */
export class PacingEntry {
  code: string;
  label: string;
  locale: string;
  margin: number;
  clicks: number;
  approved: boolean;
  conversionRate: number;
  weight: number;
  cohort: string;
  cost: number;
  windowDays: number;
  status: PacingEntryStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    margin: number,
    clicks: number,
    approved: boolean,
    conversionRate: number,
    weight: number,
    cohort: string,
    cost: number,
    windowDays: number,
    status: PacingEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.margin = margin;
    this.clicks = clicks;
    this.approved = approved;
    this.conversionRate = conversionRate;
    this.weight = weight;
    this.cohort = cohort;
    this.cost = cost;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round((this.margin + this.cost) * 100) / 100;
  }

  copy(): PacingEntry {
    return new PacingEntry(
      this.code,
      this.label,
      this.locale,
      this.margin,
      this.clicks,
      this.approved,
      this.conversionRate,
      this.weight,
      this.cohort,
      this.cost,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pacing entry in status planned. */
export function newPacingEntry(code: string, label: string): PacingEntry {
  return new PacingEntry(code, label, "", 0, 0, false, 0, 0, "", 0, 0, "planned");
}
