import * as text from "../../../../kit/text.js";

/** Where a pending macro baseline is in its life cycle. */
export type PendingMacroBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending macro baseline, with what the planners need to act on it. */
export class PendingMacroBaseline {
  code: string;
  name: string;
  cohort: string;
  graceDays: number;
  frequencyCap: number;
  retries: number;
  description: string;
  startsAt: number;
  variant: string;
  sequence: number;
  endsAt: number;
  status: PendingMacroBaselineStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    graceDays: number,
    frequencyCap: number,
    retries: number,
    description: string,
    startsAt: number,
    variant: string,
    sequence: number,
    endsAt: number,
    status: PendingMacroBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.graceDays = graceDays;
    this.frequencyCap = frequencyCap;
    this.retries = retries;
    this.description = description;
    this.startsAt = startsAt;
    this.variant = variant;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingMacroBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingMacroBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending macro baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.startsAt - this.retries) * 100) / 100;
  }

  copy(): PendingMacroBaseline {
    return new PendingMacroBaseline(
      this.code,
      this.name,
      this.cohort,
      this.graceDays,
      this.frequencyCap,
      this.retries,
      this.description,
      this.startsAt,
      this.variant,
      this.sequence,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending macro baseline in status new. */
export function newPendingMacroBaseline(code: string, name: string): PendingMacroBaseline {
  return new PendingMacroBaseline(code, name, "", 0, 0, 0, "", 0, "", 0, 0, "new");
}
