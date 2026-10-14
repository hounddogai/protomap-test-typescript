import * as text from "../../../../kit/text.js";

/** Where a nudge plan is in its life cycle. */
export type NudgePlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One nudge plan, with what the planners need to act on it. */
export class NudgePlan {
  code: string;
  label: string;
  visible: boolean;
  openRate: number;
  attempts: number;
  externalRef: string;
  amount: number;
  score: number;
  status: NudgePlanStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    openRate: number,
    attempts: number,
    externalRef: string,
    amount: number,
    score: number,
    status: NudgePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.openRate = openRate;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.amount = amount;
    this.score = score;
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

  canMoveTo(next: NudgePlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.openRate + this.attempts) * 100) / 100;
  }

  copy(): NudgePlan {
    return new NudgePlan(
      this.code,
      this.label,
      this.visible,
      this.openRate,
      this.attempts,
      this.externalRef,
      this.amount,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a nudge plan in status draft. */
export function newNudgePlan(code: string, label: string): NudgePlan {
  return new NudgePlan(code, label, false, 0, 0, "", 0, 0, "draft");
}
