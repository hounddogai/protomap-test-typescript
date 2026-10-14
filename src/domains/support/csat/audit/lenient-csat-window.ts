import * as text from "../../../../kit/text.js";

/** Where a lenient csat window is in its life cycle. */
export type LenientCsatWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient csat window and its current status. */
export class LenientCsatWindow {
  code: string;
  label: string;
  score: number;
  variant: string;
  version: number;
  approved: boolean;
  status: LenientCsatWindowStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    variant: string,
    version: number,
    approved: boolean,
    status: LenientCsatWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.variant = variant;
    this.version = version;
    this.approved = approved;
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

  canMoveTo(next: LenientCsatWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: LenientCsatWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient csat window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.version + this.score) * 100) / 100;
  }

  copy(): LenientCsatWindow {
    return new LenientCsatWindow(
      this.code,
      this.label,
      this.score,
      this.variant,
      this.version,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient csat window in status planned. */
export function newLenientCsatWindow(code: string, label: string): LenientCsatWindow {
  return new LenientCsatWindow(code, label, 0, "", 0, false, "planned");
}
