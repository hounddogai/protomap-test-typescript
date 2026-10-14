import * as text from "../../../../kit/text.js";

/** Where a strict proof adjustment is in its life cycle. */
export type StrictProofAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict proof adjustment, with what the planners need to act on it. */
export class StrictProofAdjustment {
  code: string;
  title: string;
  windowDays: number;
  active: boolean;
  durationMinutes: number;
  status: StrictProofAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    active: boolean,
    durationMinutes: number,
    status: StrictProofAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.active = active;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: StrictProofAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "done":
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

  moveTo(next: StrictProofAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict proof adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.windowDays + this.durationMinutes) * 100) / 100;
  }

  copy(): StrictProofAdjustment {
    return new StrictProofAdjustment(
      this.code,
      this.title,
      this.windowDays,
      this.active,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict proof adjustment in status new. */
export function newStrictProofAdjustment(code: string, title: string): StrictProofAdjustment {
  return new StrictProofAdjustment(code, title, 0, false, 0, "new");
}
