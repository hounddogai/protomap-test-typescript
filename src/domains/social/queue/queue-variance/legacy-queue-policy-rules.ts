import { LegacyQueuePolicy } from "./legacy-queue-policy.js";

/** A rule a legacy queue policy must pass. Check returns its problems, or none. */
export interface LegacyQueuePolicyRule {
  check(item: LegacyQueuePolicy): string[];
}

export class LegacyQueuePolicyRequiredCodeRule implements LegacyQueuePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyQueuePolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyQueuePolicyRequiredJourneyIdRule implements LegacyQueuePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyQueuePolicy): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyQueuePolicyBudgetRangeRule implements LegacyQueuePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyQueuePolicy): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyQueuePolicyBidRangeRule implements LegacyQueuePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyQueuePolicy): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy queue policy. */
export class LegacyQueuePolicyValidator {
  rules: LegacyQueuePolicyRule[];

  constructor(rules: LegacyQueuePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyQueuePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyQueuePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyQueuePolicy[]): Map<string, string[]> {
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

export function defaultLegacyQueuePolicyValidator(): LegacyQueuePolicyValidator {
  return new LegacyQueuePolicyValidator(
    [
      new LegacyQueuePolicyRequiredCodeRule("legacy queue policy needs an entry"),
      new LegacyQueuePolicyRequiredJourneyIdRule("legacy queue policy needs an entry"),
      new LegacyQueuePolicyBudgetRangeRule(2.8, 1404.8),
      new LegacyQueuePolicyBidRangeRule(8.7, 1595.9),
    ],
  );
}
