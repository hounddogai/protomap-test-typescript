import * as text from "../../../../kit/text.js";

/** Where a global streak record is in its life cycle. */
export type GlobalStreakRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global streak record, with what the planners need to act on it. */
export class GlobalStreakRecord {
  code: string;
  name: string;
  unit: string;
  openRate: number;
  budget: number;
  durationMinutes: number;
  expiresAt: number;
  locale: string;
  status: GlobalStreakRecordStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    openRate: number,
    budget: number,
    durationMinutes: number,
    expiresAt: number,
    locale: string,
    status: GlobalStreakRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.openRate = openRate;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.expiresAt = expiresAt;
    this.locale = locale;
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

  canMoveTo(next: GlobalStreakRecordStatus): boolean {
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

  moveTo(next: GlobalStreakRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global streak record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global streak record"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.budget * this.durationMinutes * 100) / 100;
  }

  copy(): GlobalStreakRecord {
    return new GlobalStreakRecord(
      this.code,
      this.name,
      this.unit,
      this.openRate,
      this.budget,
      this.durationMinutes,
      this.expiresAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global streak record in status open. */
export function newGlobalStreakRecord(code: string, name: string): GlobalStreakRecord {
  return new GlobalStreakRecord(code, name, "", 0, 0, 0, 0, "", "open");
}
