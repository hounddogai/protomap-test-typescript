import * as text from "../../../../kit/text.js";

/** Where a level batch is in its life cycle. */
export type LevelBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One level batch, with what the planners need to act on it. */
export class LevelBatch {
  code: string;
  label: string;
  campaignRef: string;
  ratio: number;
  contactEmail: string;
  graceDays: number;
  notes: string;
  windowDays: number;
  status: LevelBatchStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    ratio: number,
    contactEmail: string,
    graceDays: number,
    notes: string,
    windowDays: number,
    status: LevelBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.notes = notes;
    this.windowDays = windowDays;
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

  canMoveTo(next: LevelBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"level batch"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.ratio * this.graceDays * 100) / 100;
  }

  copy(): LevelBatch {
    return new LevelBatch(
      this.code,
      this.label,
      this.campaignRef,
      this.ratio,
      this.contactEmail,
      this.graceDays,
      this.notes,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level batch in status proposed. */
export function newLevelBatch(code: string, label: string): LevelBatch {
  return new LevelBatch(code, label, "", 0, "", 0, "", 0, "proposed");
}
