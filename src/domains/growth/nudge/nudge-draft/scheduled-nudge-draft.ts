/**
 * The scheduled nudge draft records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled nudge draft is in its life cycle. */
export type ScheduledNudgeDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a scheduled nudge draft and its current status. */
export class ScheduledNudgeDraft {
  code: string;
  title: string;
  updatedAt: number;
  description: string;
  name: string;
  cohort: string;
  status: ScheduledNudgeDraftStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    description: string,
    name: string,
    cohort: string,
    status: ScheduledNudgeDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.description = description;
    this.name = name;
    this.cohort = cohort;
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

  canMoveTo(next: ScheduledNudgeDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ScheduledNudgeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled nudge draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): ScheduledNudgeDraft {
    return new ScheduledNudgeDraft(
      this.code,
      this.title,
      this.updatedAt,
      this.description,
      this.name,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled nudge draft in status proposed. */
export function newScheduledNudgeDraft(code: string, title: string): ScheduledNudgeDraft {
  return new ScheduledNudgeDraft(code, title, 0, "", "", "", "proposed");
}
