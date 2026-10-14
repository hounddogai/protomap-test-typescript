import * as text from "../../../../kit/text.js";

/** Where a pending creative draft is in its life cycle. */
export type PendingCreativeDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending creative draft, with what the planners need to act on it. */
export class PendingCreativeDraft {
  code: string;
  title: string;
  cohort: string;
  phone: string;
  durationMinutes: number;
  status: PendingCreativeDraftStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    phone: string,
    durationMinutes: number,
    status: PendingCreativeDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.phone = phone;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingCreativeDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCreativeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending creative draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): PendingCreativeDraft {
    return new PendingCreativeDraft(this.code, this.title, this.cohort, this.phone, this.durationMinutes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending creative draft in status idle. */
export function newPendingCreativeDraft(code: string, title: string): PendingCreativeDraft {
  return new PendingCreativeDraft(code, title, "", "", 0, "idle");
}
