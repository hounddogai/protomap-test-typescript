import * as text from "../../../../kit/text.js";

/** Where a adaptive exit rule window is in its life cycle. */
export type AdaptiveExitRuleWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive exit rule window, with what the planners need to act on it. */
export class AdaptiveExitRuleWindow {
  code: string;
  name: string;
  visible: boolean;
  attempts: number;
  minimum: number;
  country: string;
  capacity: number;
  durationMinutes: number;
  bid: number;
  status: AdaptiveExitRuleWindowStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    attempts: number,
    minimum: number,
    country: string,
    capacity: number,
    durationMinutes: number,
    bid: number,
    status: AdaptiveExitRuleWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.attempts = attempts;
    this.minimum = minimum;
    this.country = country;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
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

  canMoveTo(next: AdaptiveExitRuleWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveExitRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive exit rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedTotal(): number {
    return Math.round((this.durationMinutes - this.capacity) * 100) / 100;
  }

  copy(): AdaptiveExitRuleWindow {
    return new AdaptiveExitRuleWindow(
      this.code,
      this.name,
      this.visible,
      this.attempts,
      this.minimum,
      this.country,
      this.capacity,
      this.durationMinutes,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive exit rule window in status draft. */
export function newAdaptiveExitRuleWindow(code: string, name: string): AdaptiveExitRuleWindow {
  return new AdaptiveExitRuleWindow(code, name, false, 0, 0, "", 0, 0, 0, "draft");
}
