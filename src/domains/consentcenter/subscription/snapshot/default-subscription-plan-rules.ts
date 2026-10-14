import { DefaultSubscriptionPlan } from "./default-subscription-plan.js";

/** A rule a default subscription plan must pass. Check returns its problems, or none. */
export interface DefaultSubscriptionPlanRule {
  check(item: DefaultSubscriptionPlan): string[];
}

export class DefaultSubscriptionPlanRequiredDescriptionRule implements DefaultSubscriptionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSubscriptionPlan): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSubscriptionPlanSendAtRangeRule implements DefaultSubscriptionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSubscriptionPlan): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultSubscriptionPlanPriorityRangeRule implements DefaultSubscriptionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSubscriptionPlan): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultSubscriptionPlanApprovedGuardRule implements DefaultSubscriptionPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultSubscriptionPlan): string[] {
    if (item.approved && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a default subscription plan. */
export class DefaultSubscriptionPlanValidator {
  rules: DefaultSubscriptionPlanRule[];

  constructor(rules: DefaultSubscriptionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSubscriptionPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: DefaultSubscriptionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSubscriptionPlan[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultDefaultSubscriptionPlanValidator(): DefaultSubscriptionPlanValidator {
  return new DefaultSubscriptionPlanValidator(
    [
      new DefaultSubscriptionPlanRequiredDescriptionRule("default subscription plan needs a value"),
      new DefaultSubscriptionPlanSendAtRangeRule(32, 64),
      new DefaultSubscriptionPlanPriorityRangeRule(3600, 86400),
      new DefaultSubscriptionPlanApprovedGuardRule(120),
    ],
  );
}
