import * as text from "../../../../kit/text.js";

/** Where a suppression cycle is in its life cycle. */
export type SuppressionCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** One suppression cycle, with what the planners need to act on it. */
export class SuppressionCycle {
  code: string;
  name: string;
  budget: number;
  locale: string;
  rate: number;
  status: SuppressionCycleStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    locale: string,
    rate: number,
    status: SuppressionCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.locale = locale;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"suppression cycle"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.rate - this.budget) * 100) / 100;
  }

  copy(): SuppressionCycle {
    return new SuppressionCycle(this.code, this.name, this.budget, this.locale, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a suppression cycle in status requested. */
export function newSuppressionCycle(code: string, name: string): SuppressionCycle {
  return new SuppressionCycle(code, name, 0, "", 0, "requested");
}
