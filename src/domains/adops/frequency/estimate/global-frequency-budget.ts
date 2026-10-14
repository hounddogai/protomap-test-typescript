import * as text from "../../../../kit/text.js";

/** Where a global frequency budget is in its life cycle. */
export type GlobalFrequencyBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One global frequency budget, with what the planners need to act on it. */
export class GlobalFrequencyBudget {
  code: string;
  name: string;
  sendAt: number;
  version: number;
  cohort: string;
  capacity: number;
  ratio: number;
  visible: boolean;
  revision: number;
  amount: number;
  status: GlobalFrequencyBudgetStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    version: number,
    cohort: string,
    capacity: number,
    ratio: number,
    visible: boolean,
    revision: number,
    amount: number,
    status: GlobalFrequencyBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.version = version;
    this.cohort = cohort;
    this.capacity = capacity;
    this.ratio = ratio;
    this.visible = visible;
    this.revision = revision;
    this.amount = amount;
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

  canMoveTo(next: GlobalFrequencyBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: GlobalFrequencyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global frequency budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.sendAt + this.amount) * 100) / 100;
  }

  copy(): GlobalFrequencyBudget {
    return new GlobalFrequencyBudget(
      this.code,
      this.name,
      this.sendAt,
      this.version,
      this.cohort,
      this.capacity,
      this.ratio,
      this.visible,
      this.revision,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global frequency budget in status draft. */
export function newGlobalFrequencyBudget(code: string, name: string): GlobalFrequencyBudget {
  return new GlobalFrequencyBudget(code, name, 0, 0, "", 0, 0, false, 0, 0, "draft");
}
