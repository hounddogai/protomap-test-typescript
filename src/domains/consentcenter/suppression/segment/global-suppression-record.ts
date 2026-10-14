import * as text from "../../../../kit/text.js";

/** Where a global suppression record is in its life cycle. */
export type GlobalSuppressionRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global suppression record. Its code is unique within a tenant. */
export class GlobalSuppressionRecord {
  code: string;
  name: string;
  source: string;
  notes: string;
  segment: string;
  budget: number;
  conversionRate: number;
  locale: string;
  phone: string;
  retries: number;
  status: GlobalSuppressionRecordStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    notes: string,
    segment: string,
    budget: number,
    conversionRate: number,
    locale: string,
    phone: string,
    retries: number,
    status: GlobalSuppressionRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.notes = notes;
    this.segment = segment;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.phone = phone;
    this.retries = retries;
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

  canMoveTo(next: GlobalSuppressionRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalSuppressionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global suppression record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global suppression record"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.retries - this.budget) * 100) / 100;
  }

  copy(): GlobalSuppressionRecord {
    return new GlobalSuppressionRecord(
      this.code,
      this.name,
      this.source,
      this.notes,
      this.segment,
      this.budget,
      this.conversionRate,
      this.locale,
      this.phone,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global suppression record in status planned. */
export function newGlobalSuppressionRecord(code: string, name: string): GlobalSuppressionRecord {
  return new GlobalSuppressionRecord(code, name, "", "", "", 0, 0, "", "", 0, "planned");
}
