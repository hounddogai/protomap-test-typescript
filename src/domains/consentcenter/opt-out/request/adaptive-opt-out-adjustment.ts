import * as text from "../../../../kit/text.js";

/** Where a adaptive opt out adjustment is in its life cycle. */
export type AdaptiveOptOutAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive opt out adjustment as the opt out team keeps it. */
export class AdaptiveOptOutAdjustment {
  code: string;
  title: string;
  ceiling: number;
  audienceId: string;
  capacity: number;
  cohort: string;
  status: AdaptiveOptOutAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    audienceId: string,
    capacity: number,
    cohort: string,
    status: AdaptiveOptOutAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.audienceId = audienceId;
    this.capacity = capacity;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveOptOutAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveOptOutAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive opt out adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.ceiling + this.capacity) * 100) / 100;
  }

  copy(): AdaptiveOptOutAdjustment {
    return new AdaptiveOptOutAdjustment(
      this.code,
      this.title,
      this.ceiling,
      this.audienceId,
      this.capacity,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive opt out adjustment in status draft. */
export function newAdaptiveOptOutAdjustment(code: string, title: string): AdaptiveOptOutAdjustment {
  return new AdaptiveOptOutAdjustment(code, title, 0, "", 0, "", "draft");
}
