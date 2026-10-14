import * as text from "../../../../kit/text.js";

/** Where a regional touchpoint budget is in its life cycle. */
export type RegionalTouchpointBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional touchpoint budget, with what the planners need to act on it. */
export class RegionalTouchpointBudget {
  code: string;
  title: string;
  quantity: number;
  version: number;
  description: string;
  visible: boolean;
  status: RegionalTouchpointBudgetStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    version: number,
    description: string,
    visible: boolean,
    status: RegionalTouchpointBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.version = version;
    this.description = description;
    this.visible = visible;
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

  canMoveTo(next: RegionalTouchpointBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalTouchpointBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional touchpoint budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round(this.version * this.quantity * 100) / 100;
  }

  copy(): RegionalTouchpointBudget {
    return new RegionalTouchpointBudget(
      this.code,
      this.title,
      this.quantity,
      this.version,
      this.description,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional touchpoint budget in status idle. */
export function newRegionalTouchpointBudget(code: string, title: string): RegionalTouchpointBudget {
  return new RegionalTouchpointBudget(code, title, 0, 0, "", false, "idle");
}
