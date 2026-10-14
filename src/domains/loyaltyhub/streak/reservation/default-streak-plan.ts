import * as text from "../../../../kit/text.js";

/** Where a default streak plan is in its life cycle. */
export type DefaultStreakPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One default streak plan, with what the planners need to act on it. */
export class DefaultStreakPlan {
  code: string;
  name: string;
  weight: number;
  channel: string;
  currency: string;
  createdAt: number;
  locale: string;
  budget: number;
  status: DefaultStreakPlanStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    channel: string,
    currency: string,
    createdAt: number,
    locale: string,
    budget: number,
    status: DefaultStreakPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.channel = channel;
    this.currency = currency;
    this.createdAt = createdAt;
    this.locale = locale;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultStreakPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultStreakPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default streak plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.budget + this.weight) * 100) / 100;
  }

  copy(): DefaultStreakPlan {
    return new DefaultStreakPlan(
      this.code,
      this.name,
      this.weight,
      this.channel,
      this.currency,
      this.createdAt,
      this.locale,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default streak plan in status open. */
export function newDefaultStreakPlan(code: string, name: string): DefaultStreakPlan {
  return new DefaultStreakPlan(code, name, 0, "", "", 0, "", 0, "open");
}
