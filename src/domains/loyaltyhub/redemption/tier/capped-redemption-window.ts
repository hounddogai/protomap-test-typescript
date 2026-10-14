import * as text from "../../../../kit/text.js";

/** Where a capped redemption window is in its life cycle. */
export type CappedRedemptionWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One capped redemption window, with what the planners need to act on it. */
export class CappedRedemptionWindow {
  code: string;
  name: string;
  budget: number;
  threshold: number;
  active: boolean;
  startsAt: number;
  phone: string;
  status: CappedRedemptionWindowStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    threshold: number,
    active: boolean,
    startsAt: number,
    phone: string,
    status: CappedRedemptionWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.threshold = threshold;
    this.active = active;
    this.startsAt = startsAt;
    this.phone = phone;
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

  canMoveTo(next: CappedRedemptionWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedRedemptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped redemption window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped redemption window"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.startsAt - this.threshold) * 100) / 100;
  }

  copy(): CappedRedemptionWindow {
    return new CappedRedemptionWindow(
      this.code,
      this.name,
      this.budget,
      this.threshold,
      this.active,
      this.startsAt,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped redemption window in status draft. */
export function newCappedRedemptionWindow(code: string, name: string): CappedRedemptionWindow {
  return new CappedRedemptionWindow(code, name, 0, 0, false, 0, "", "draft");
}
