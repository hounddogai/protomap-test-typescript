import * as text from "../../../../kit/text.js";

/** Where a touchpoint plan is in its life cycle. */
export type TouchpointPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a touchpoint plan and its current status. */
export class TouchpointPlan {
  code: string;
  title: string;
  quantity: number;
  reviewer: string;
  currency: string;
  cost: number;
  durationMinutes: number;
  label: string;
  status: TouchpointPlanStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    reviewer: string,
    currency: string,
    cost: number,
    durationMinutes: number,
    label: string,
    status: TouchpointPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.currency = currency;
    this.cost = cost;
    this.durationMinutes = durationMinutes;
    this.label = label;
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

  canMoveTo(next: TouchpointPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TouchpointPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.durationMinutes + this.cost) * 100) / 100;
  }

  copy(): TouchpointPlan {
    return new TouchpointPlan(
      this.code,
      this.title,
      this.quantity,
      this.reviewer,
      this.currency,
      this.cost,
      this.durationMinutes,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a touchpoint plan in status draft. */
export function newTouchpointPlan(code: string, title: string): TouchpointPlan {
  return new TouchpointPlan(code, title, 0, "", "", 0, 0, "", "draft");
}
