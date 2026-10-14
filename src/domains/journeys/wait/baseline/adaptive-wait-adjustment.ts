import * as text from "../../../../kit/text.js";

/** Where a adaptive wait adjustment is in its life cycle. */
export type AdaptiveWaitAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive wait adjustment. Its code is unique within a tenant. */
export class AdaptiveWaitAdjustment {
  code: string;
  name: string;
  audienceId: string;
  journeyId: string;
  budget: number;
  status: AdaptiveWaitAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    journeyId: string,
    budget: number,
    status: AdaptiveWaitAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveWaitAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveWaitAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive wait adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive wait adjustment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): AdaptiveWaitAdjustment {
    return new AdaptiveWaitAdjustment(this.code, this.name, this.audienceId, this.journeyId, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive wait adjustment in status open. */
export function newAdaptiveWaitAdjustment(code: string, name: string): AdaptiveWaitAdjustment {
  return new AdaptiveWaitAdjustment(code, name, "", "", 0, "open");
}
