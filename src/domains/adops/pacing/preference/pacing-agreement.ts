import * as text from "../../../../kit/text.js";

/** Where a pacing agreement is in its life cycle. */
export type PacingAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a pacing agreement and its current status. */
export class PacingAgreement {
  code: string;
  label: string;
  category: string;
  graceDays: number;
  bid: number;
  segment: string;
  endsAt: number;
  status: PacingAgreementStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    graceDays: number,
    bid: number,
    segment: string,
    endsAt: number,
    status: PacingAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.graceDays = graceDays;
    this.bid = bid;
    this.segment = segment;
    this.endsAt = endsAt;
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

  canMoveTo(next: PacingAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PacingAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.endsAt - this.bid) * 100) / 100;
  }

  copy(): PacingAgreement {
    return new PacingAgreement(
      this.code,
      this.label,
      this.category,
      this.graceDays,
      this.bid,
      this.segment,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pacing agreement in status planned. */
export function newPacingAgreement(code: string, label: string): PacingAgreement {
  return new PacingAgreement(code, label, "", 0, 0, "", 0, "planned");
}
