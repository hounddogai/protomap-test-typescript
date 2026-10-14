import * as text from "../../../../kit/text.js";

/** Where a manual opt out agreement is in its life cycle. */
export type ManualOptOutAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual opt out agreement and its current status. */
export class ManualOptOutAgreement {
  code: string;
  label: string;
  sendAt: number;
  locale: string;
  sequence: number;
  capacity: number;
  summary: string;
  status: ManualOptOutAgreementStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    locale: string,
    sequence: number,
    capacity: number,
    summary: string,
    status: ManualOptOutAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.locale = locale;
    this.sequence = sequence;
    this.capacity = capacity;
    this.summary = summary;
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

  canMoveTo(next: ManualOptOutAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualOptOutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual opt out agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.sequence + this.capacity) * 100) / 100;
  }

  copy(): ManualOptOutAgreement {
    return new ManualOptOutAgreement(
      this.code,
      this.label,
      this.sendAt,
      this.locale,
      this.sequence,
      this.capacity,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual opt out agreement in status planned. */
export function newManualOptOutAgreement(code: string, label: string): ManualOptOutAgreement {
  return new ManualOptOutAgreement(code, label, 0, "", 0, 0, "", "planned");
}
