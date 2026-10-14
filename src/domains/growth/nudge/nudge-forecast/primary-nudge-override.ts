import * as text from "../../../../kit/text.js";

/** Where a primary nudge override is in its life cycle. */
export type PrimaryNudgeOverrideStatus = "created" | "validated" | "published" | "retired";

/** A primary nudge override as the nudge team keeps it. */
export class PrimaryNudgeOverride {
  code: string;
  label: string;
  locale: string;
  graceDays: number;
  journeyId: string;
  createdAt: number;
  status: PrimaryNudgeOverrideStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    graceDays: number,
    journeyId: string,
    createdAt: number,
    status: PrimaryNudgeOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.graceDays = graceDays;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
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

  canMoveTo(next: PrimaryNudgeOverrideStatus): boolean {
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

  moveTo(next: PrimaryNudgeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary nudge override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.createdAt - this.graceDays) * 100) / 100;
  }

  copy(): PrimaryNudgeOverride {
    return new PrimaryNudgeOverride(
      this.code,
      this.label,
      this.locale,
      this.graceDays,
      this.journeyId,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary nudge override in status created. */
export function newPrimaryNudgeOverride(code: string, label: string): PrimaryNudgeOverride {
  return new PrimaryNudgeOverride(code, label, "", 0, "", 0, "created");
}
