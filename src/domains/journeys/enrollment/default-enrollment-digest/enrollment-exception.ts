import * as text from "../../../../kit/text.js";

/** Where a enrollment exception is in its life cycle. */
export type EnrollmentExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A enrollment exception as the enrollment team keeps it. */
export class EnrollmentException {
  code: string;
  label: string;
  updatedAt: number;
  durationMinutes: number;
  cost: number;
  capacity: number;
  title: string;
  externalRef: string;
  batchSize: number;
  status: EnrollmentExceptionStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    durationMinutes: number,
    cost: number,
    capacity: number,
    title: string,
    externalRef: string,
    batchSize: number,
    status: EnrollmentExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.durationMinutes = durationMinutes;
    this.cost = cost;
    this.capacity = capacity;
    this.title = title;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
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

  canMoveTo(next: EnrollmentExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: EnrollmentExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"enrollment exception"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.batchSize - this.durationMinutes) * 100) / 100;
  }

  copy(): EnrollmentException {
    return new EnrollmentException(
      this.code,
      this.label,
      this.updatedAt,
      this.durationMinutes,
      this.cost,
      this.capacity,
      this.title,
      this.externalRef,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a enrollment exception in status proposed. */
export function newEnrollmentException(code: string, label: string): EnrollmentException {
  return new EnrollmentException(code, label, 0, 0, 0, 0, "", "", 0, "proposed");
}
