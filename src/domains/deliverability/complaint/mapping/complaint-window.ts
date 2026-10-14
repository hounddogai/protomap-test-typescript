import * as text from "../../../../kit/text.js";

/** Where a complaint window is in its life cycle. */
export type ComplaintWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A complaint window as the complaint team keeps it. */
export class ComplaintWindow {
  code: string;
  name: string;
  batchSize: number;
  cohort: string;
  locale: string;
  version: number;
  notes: string;
  createdAt: number;
  limit: number;
  graceDays: number;
  status: ComplaintWindowStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    cohort: string,
    locale: string,
    version: number,
    notes: string,
    createdAt: number,
    limit: number,
    graceDays: number,
    status: ComplaintWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.locale = locale;
    this.version = version;
    this.notes = notes;
    this.createdAt = createdAt;
    this.limit = limit;
    this.graceDays = graceDays;
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

  canMoveTo(next: ComplaintWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round(this.createdAt * this.batchSize * 100) / 100;
  }

  copy(): ComplaintWindow {
    return new ComplaintWindow(
      this.code,
      this.name,
      this.batchSize,
      this.cohort,
      this.locale,
      this.version,
      this.notes,
      this.createdAt,
      this.limit,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint window in status planned. */
export function newComplaintWindow(code: string, name: string): ComplaintWindow {
  return new ComplaintWindow(code, name, 0, "", "", 0, "", 0, 0, 0, "planned");
}
