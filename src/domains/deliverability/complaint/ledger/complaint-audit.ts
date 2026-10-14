import * as text from "../../../../kit/text.js";

/** Where a complaint audit is in its life cycle. */
export type ComplaintAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a complaint audit and its current status. */
export class ComplaintAudit {
  code: string;
  label: string;
  revision: number;
  notes: string;
  graceDays: number;
  updatedAt: number;
  status: ComplaintAuditStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    notes: string,
    graceDays: number,
    updatedAt: number,
    status: ComplaintAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.notes = notes;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: ComplaintAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: ComplaintAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round(this.updatedAt * this.revision * 100) / 100;
  }

  copy(): ComplaintAudit {
    return new ComplaintAudit(
      this.code,
      this.label,
      this.revision,
      this.notes,
      this.graceDays,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a complaint audit in status planned. */
export function newComplaintAudit(code: string, label: string): ComplaintAudit {
  return new ComplaintAudit(code, label, 0, "", 0, 0, "planned");
}
