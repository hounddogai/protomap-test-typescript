import * as text from "../../../../kit/text.js";

/** Where a window plan is in its life cycle. */
export type WindowPlanStatus = "created" | "validated" | "published" | "retired";

/** A window plan as the window team keeps it. */
export class WindowPlan {
  code: string;
  label: string;
  graceDays: number;
  attempts: number;
  openRate: number;
  status: WindowPlanStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    attempts: number,
    openRate: number,
    status: WindowPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.attempts = attempts;
    this.openRate = openRate;
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

  canMoveTo(next: WindowPlanStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WindowPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.openRate + this.attempts) * 100) / 100;
  }

  copy(): WindowPlan {
    return new WindowPlan(this.code, this.label, this.graceDays, this.attempts, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a window plan in status created. */
export function newWindowPlan(code: string, label: string): WindowPlan {
  return new WindowPlan(code, label, 0, 0, 0, "created");
}
