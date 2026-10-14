import * as text from "../../../../kit/text.js";

/** Where a insight entry is in its life cycle. */
export type InsightEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One insight entry, with what the planners need to act on it. */
export class InsightEntry {
  code: string;
  name: string;
  weight: number;
  approved: boolean;
  graceDays: number;
  variant: string;
  status: InsightEntryStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    approved: boolean,
    graceDays: number,
    variant: string,
    status: InsightEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.approved = approved;
    this.graceDays = graceDays;
    this.variant = variant;
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

  canMoveTo(next: InsightEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
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

  moveTo(next: InsightEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round(this.weight * this.graceDays * 100) / 100;
  }

  copy(): InsightEntry {
    return new InsightEntry(
      this.code,
      this.name,
      this.weight,
      this.approved,
      this.graceDays,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a insight entry in status proposed. */
export function newInsightEntry(code: string, name: string): InsightEntry {
  return new InsightEntry(code, name, 0, false, 0, "", "proposed");
}
