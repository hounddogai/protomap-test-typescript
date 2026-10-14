import * as text from "../../../../kit/text.js";

/** Where a redemption plan is in its life cycle. */
export type RedemptionPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** One redemption plan, with what the planners need to act on it. */
export class RedemptionPlan {
  code: string;
  name: string;
  priority: number;
  active: boolean;
  threshold: number;
  notes: string;
  utmSource: string;
  status: RedemptionPlanStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    active: boolean,
    threshold: number,
    notes: string,
    utmSource: string,
    status: RedemptionPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.active = active;
    this.threshold = threshold;
    this.notes = notes;
    this.utmSource = utmSource;
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

  canMoveTo(next: RedemptionPlanStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.threshold - this.priority) * 100) / 100;
  }

  copy(): RedemptionPlan {
    return new RedemptionPlan(
      this.code,
      this.name,
      this.priority,
      this.active,
      this.threshold,
      this.notes,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a redemption plan in status new. */
export function newRedemptionPlan(code: string, name: string): RedemptionPlan {
  return new RedemptionPlan(code, name, 0, false, 0, "", "", "new");
}
