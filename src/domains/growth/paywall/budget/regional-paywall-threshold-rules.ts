import { RegionalPaywallThreshold } from "./regional-paywall-threshold.js";

/** A rule a regional paywall threshold must pass. Check returns its problems, or none. */
export interface RegionalPaywallThresholdRule {
  check(item: RegionalPaywallThreshold): string[];
}

export class RegionalPaywallThresholdActiveGuardRule implements RegionalPaywallThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalPaywallThreshold): string[] {
    if (item.active && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RegionalPaywallThresholdRequiredLocaleRule implements RegionalPaywallThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPaywallThreshold): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPaywallThresholdCostRangeRule implements RegionalPaywallThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPaywallThreshold): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPaywallThresholdRequiredCodeRule implements RegionalPaywallThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPaywallThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional paywall threshold. */
export class RegionalPaywallThresholdValidator {
  rules: RegionalPaywallThresholdRule[];

  constructor(rules: RegionalPaywallThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPaywallThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPaywallThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPaywallThreshold[]): Map<string, string[]> {
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

export function defaultRegionalPaywallThresholdValidator(): RegionalPaywallThresholdValidator {
  return new RegionalPaywallThresholdValidator(
    [
      new RegionalPaywallThresholdActiveGuardRule(120),
      new RegionalPaywallThresholdRequiredLocaleRule("regional paywall threshold needs an entry"),
      new RegionalPaywallThresholdCostRangeRule(4.3, 4971.6),
      new RegionalPaywallThresholdRequiredCodeRule("regional paywall threshold needs an entry"),
    ],
  );
}
