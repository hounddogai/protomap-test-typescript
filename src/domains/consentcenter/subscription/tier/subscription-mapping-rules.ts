import { SubscriptionMapping } from "./subscription-mapping.js";

/** A rule a subscription mapping must pass. Check returns its problems, or none. */
export interface SubscriptionMappingRule {
  check(item: SubscriptionMapping): string[];
}

export class SubscriptionMappingRequiredLabelRule implements SubscriptionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionMappingCodePrefixRule implements SubscriptionMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionMappingScoreRangeRule implements SubscriptionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionMapping): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionMappingRequiredRegionRule implements SubscriptionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionMapping): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription mapping. */
export class SubscriptionMappingValidator {
  rules: SubscriptionMappingRule[];

  constructor(rules: SubscriptionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionMapping[]): Map<string, string[]> {
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

export function defaultSubscriptionMappingValidator(): SubscriptionMappingValidator {
  return new SubscriptionMappingValidator(
    [
      new SubscriptionMappingRequiredLabelRule("subscription mapping needs a value"),
      new SubscriptionMappingCodePrefixRule("ACM"),
      new SubscriptionMappingScoreRangeRule(9.2, 2953.8),
      new SubscriptionMappingRequiredRegionRule("subscription mapping needs a value"),
    ],
  );
}
