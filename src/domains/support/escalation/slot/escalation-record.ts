import * as text from "../../../../kit/text.js";

/** Where a escalation record is in its life cycle. */
export type EscalationRecordStatus = "created" | "validated" | "published" | "retired";

/** A escalation record. Its code is unique within a tenant. */
export class EscalationRecord {
  code: string;
  label: string;
  approved: boolean;
  segment: string;
  minimum: number;
  capacity: number;
  category: string;
  utmSource: string;
  updatedAt: number;
  name: string;
  status: EscalationRecordStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    segment: string,
    minimum: number,
    capacity: number,
    category: string,
    utmSource: string,
    updatedAt: number,
    name: string,
    status: EscalationRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.segment = segment;
    this.minimum = minimum;
    this.capacity = capacity;
    this.category = category;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: EscalationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedTotal(): number {
    return Math.round(this.minimum * this.capacity * 100) / 100;
  }

  copy(): EscalationRecord {
    return new EscalationRecord(
      this.code,
      this.label,
      this.approved,
      this.segment,
      this.minimum,
      this.capacity,
      this.category,
      this.utmSource,
      this.updatedAt,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a escalation record in status created. */
export function newEscalationRecord(code: string, label: string): EscalationRecord {
  return new EscalationRecord(code, label, false, "", 0, 0, "", "", 0, "", "created");
}
