import * as text from "../../../../kit/text.js";

/** Where a insight record is in its life cycle. */
export type InsightRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** A insight record. Its code is unique within a tenant. */
export class InsightRecord {
  code: string;
  name: string;
  updatedAt: number;
  cohort: string;
  durationMinutes: number;
  variant: string;
  status: InsightRecordStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    cohort: string,
    durationMinutes: number,
    variant: string,
    status: InsightRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
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

  canMoveTo(next: InsightRecordStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "done" || next === "failed";
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

  moveTo(next: InsightRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.updatedAt - this.durationMinutes) * 100) / 100;
  }

  copy(): InsightRecord {
    return new InsightRecord(
      this.code,
      this.name,
      this.updatedAt,
      this.cohort,
      this.durationMinutes,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a insight record in status new. */
export function newInsightRecord(code: string, name: string): InsightRecord {
  return new InsightRecord(code, name, 0, "", 0, "", "new");
}
