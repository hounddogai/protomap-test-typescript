import * as text from "../../../../kit/text.js";

/** Where a subscription rule is in its life cycle. */
export type SubscriptionRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A subscription rule. Its code is unique within a tenant. */
export class SubscriptionRule {
  code: string;
  name: string;
  description: string;
  quantity: number;
  audienceId: string;
  startsAt: number;
  priority: number;
  revision: number;
  cost: number;
  budget: number;
  status: SubscriptionRuleStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    quantity: number,
    audienceId: string,
    startsAt: number,
    priority: number,
    revision: number,
    cost: number,
    budget: number,
    status: SubscriptionRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.priority = priority;
    this.revision = revision;
    this.cost = cost;
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

  canMoveTo(next: SubscriptionRuleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.startsAt * this.quantity * 100) / 100;
  }

  copy(): SubscriptionRule {
    return new SubscriptionRule(
      this.code,
      this.name,
      this.description,
      this.quantity,
      this.audienceId,
      this.startsAt,
      this.priority,
      this.revision,
      this.cost,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a subscription rule in status open. */
export function newSubscriptionRule(code: string, name: string): SubscriptionRule {
  return new SubscriptionRule(code, name, "", 0, "", 0, 0, 0, 0, 0, "open");
}
