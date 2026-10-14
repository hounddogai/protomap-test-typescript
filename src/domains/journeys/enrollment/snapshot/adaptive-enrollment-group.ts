import * as text from "../../../../kit/text.js";

/** Where a adaptive enrollment group is in its life cycle. */
export type AdaptiveEnrollmentGroupStatus = "created" | "validated" | "published" | "retired";

/** The record of a adaptive enrollment group and its current status. */
export class AdaptiveEnrollmentGroup {
  code: string;
  label: string;
  audienceId: string;
  name: string;
  attempts: number;
  status: AdaptiveEnrollmentGroupStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    name: string,
    attempts: number,
    status: AdaptiveEnrollmentGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.name = name;
    this.attempts = attempts;
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

  canMoveTo(next: AdaptiveEnrollmentGroupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: AdaptiveEnrollmentGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive enrollment group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): AdaptiveEnrollmentGroup {
    return new AdaptiveEnrollmentGroup(this.code, this.label, this.audienceId, this.name, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive enrollment group in status created. */
export function newAdaptiveEnrollmentGroup(code: string, label: string): AdaptiveEnrollmentGroup {
  return new AdaptiveEnrollmentGroup(code, label, "", "", 0, "created");
}
