import * as text from "../../../../kit/text.js";

/** Where a step profile is in its life cycle. */
export type StepProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A step profile. Its code is unique within a tenant. */
export class StepProfile {
  code: string;
  label: string;
  updatedAt: number;
  archived: boolean;
  sequence: number;
  segment: string;
  durationMinutes: number;
  margin: number;
  graceDays: number;
  currency: string;
  status: StepProfileStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    archived: boolean,
    sequence: number,
    segment: string,
    durationMinutes: number,
    margin: number,
    graceDays: number,
    currency: string,
    status: StepProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.archived = archived;
    this.sequence = sequence;
    this.segment = segment;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.graceDays = graceDays;
    this.currency = currency;
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

  canMoveTo(next: StepProfileStatus): boolean {
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

  moveTo(next: StepProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.durationMinutes - this.margin) * 100) / 100;
  }

  copy(): StepProfile {
    return new StepProfile(
      this.code,
      this.label,
      this.updatedAt,
      this.archived,
      this.sequence,
      this.segment,
      this.durationMinutes,
      this.margin,
      this.graceDays,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a step profile in status proposed. */
export function newStepProfile(code: string, label: string): StepProfile {
  return new StepProfile(code, label, 0, false, 0, "", 0, 0, 0, "", "proposed");
}
