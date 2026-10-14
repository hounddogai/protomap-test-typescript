import * as text from "../../../../kit/text.js";

/** Where a default reward rule budget is in its life cycle. */
export type DefaultRewardRuleBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A default reward rule budget as the reward rule team keeps it. */
export class DefaultRewardRuleBudget {
  code: string;
  title: string;
  frequencyCap: number;
  description: string;
  cohort: string;
  status: DefaultRewardRuleBudgetStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    description: string,
    cohort: string,
    status: DefaultRewardRuleBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.cohort = cohort;
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

  canMoveTo(next: DefaultRewardRuleBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultRewardRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default reward rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): DefaultRewardRuleBudget {
    return new DefaultRewardRuleBudget(
      this.code,
      this.title,
      this.frequencyCap,
      this.description,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default reward rule budget in status requested. */
export function newDefaultRewardRuleBudget(code: string, title: string): DefaultRewardRuleBudget {
  return new DefaultRewardRuleBudget(code, title, 0, "", "", "requested");
}
