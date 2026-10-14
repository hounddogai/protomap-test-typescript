import * as text from "../../../../kit/text.js";

/** Where a global challenge cycle is in its life cycle. */
export type GlobalChallengeCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a global challenge cycle and its current status. */
export class GlobalChallengeCycle {
  code: string;
  title: string;
  active: boolean;
  name: string;
  minimum: number;
  quantity: number;
  ceiling: number;
  rate: number;
  graceDays: number;
  status: GlobalChallengeCycleStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    name: string,
    minimum: number,
    quantity: number,
    ceiling: number,
    rate: number,
    graceDays: number,
    status: GlobalChallengeCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.name = name;
    this.minimum = minimum;
    this.quantity = quantity;
    this.ceiling = ceiling;
    this.rate = rate;
    this.graceDays = graceDays;
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

  canMoveTo(next: GlobalChallengeCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalChallengeCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global challenge cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round((this.rate + this.quantity) * 100) / 100;
  }

  copy(): GlobalChallengeCycle {
    return new GlobalChallengeCycle(
      this.code,
      this.title,
      this.active,
      this.name,
      this.minimum,
      this.quantity,
      this.ceiling,
      this.rate,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global challenge cycle in status planned. */
export function newGlobalChallengeCycle(code: string, title: string): GlobalChallengeCycle {
  return new GlobalChallengeCycle(code, title, false, "", 0, 0, 0, 0, 0, "planned");
}
