import * as text from "../../../../kit/text.js";

/** Where a double opt in record is in its life cycle. */
export type DoubleOptInRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A double opt in record as the double opt in team keeps it. */
export class DoubleOptInRecord {
  code: string;
  label: string;
  title: string;
  updatedAt: number;
  margin: number;
  rate: number;
  createdAt: number;
  status: DoubleOptInRecordStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    updatedAt: number,
    margin: number,
    rate: number,
    createdAt: number,
    status: DoubleOptInRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.updatedAt = updatedAt;
    this.margin = margin;
    this.rate = rate;
    this.createdAt = createdAt;
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

  canMoveTo(next: DoubleOptInRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.margin - this.createdAt) * 100) / 100;
  }

  copy(): DoubleOptInRecord {
    return new DoubleOptInRecord(
      this.code,
      this.label,
      this.title,
      this.updatedAt,
      this.margin,
      this.rate,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a double opt in record in status planned. */
export function newDoubleOptInRecord(code: string, label: string): DoubleOptInRecord {
  return new DoubleOptInRecord(code, label, "", 0, 0, 0, 0, "planned");
}
