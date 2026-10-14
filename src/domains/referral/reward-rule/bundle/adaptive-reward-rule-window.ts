import * as text from "../../../../kit/text.js";

/** Where a adaptive reward rule window is in its life cycle. */
export type AdaptiveRewardRuleWindowStatus = "created" | "validated" | "published" | "retired";

/** The record of a adaptive reward rule window and its current status. */
export class AdaptiveRewardRuleWindow {
  code: string;
  label: string;
  budget: number;
  currency: string;
  source: string;
  ownerId: string;
  status: AdaptiveRewardRuleWindowStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    currency: string,
    source: string,
    ownerId: string,
    status: AdaptiveRewardRuleWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.currency = currency;
    this.source = source;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveRewardRuleWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveRewardRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reward rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): AdaptiveRewardRuleWindow {
    return new AdaptiveRewardRuleWindow(
      this.code,
      this.label,
      this.budget,
      this.currency,
      this.source,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive reward rule window in status created. */
export function newAdaptiveRewardRuleWindow(code: string, label: string): AdaptiveRewardRuleWindow {
  return new AdaptiveRewardRuleWindow(code, label, 0, "", "", "", "created");
}
