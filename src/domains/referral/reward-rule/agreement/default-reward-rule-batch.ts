import * as text from "../../../../kit/text.js";

/** Where a default reward rule batch is in its life cycle. */
export type DefaultRewardRuleBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One default reward rule batch, with what the planners need to act on it. */
export class DefaultRewardRuleBatch {
  code: string;
  name: string;
  active: boolean;
  attempts: number;
  cost: number;
  minimum: number;
  currency: string;
  status: DefaultRewardRuleBatchStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    attempts: number,
    cost: number,
    minimum: number,
    currency: string,
    status: DefaultRewardRuleBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.attempts = attempts;
    this.cost = cost;
    this.minimum = minimum;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultRewardRuleBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultRewardRuleBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default reward rule batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round(this.cost * this.attempts * 100) / 100;
  }

  copy(): DefaultRewardRuleBatch {
    return new DefaultRewardRuleBatch(
      this.code,
      this.name,
      this.active,
      this.attempts,
      this.cost,
      this.minimum,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default reward rule batch in status proposed. */
export function newDefaultRewardRuleBatch(code: string, name: string): DefaultRewardRuleBatch {
  return new DefaultRewardRuleBatch(code, name, false, 0, 0, 0, "", "proposed");
}
