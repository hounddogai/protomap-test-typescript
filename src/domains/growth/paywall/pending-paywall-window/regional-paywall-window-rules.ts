import { RegionalPaywallWindow } from "./regional-paywall-window.js";

/** A rule a regional paywall window must pass. Check returns its problems, or none. */
export interface RegionalPaywallWindowRule {
  check(item: RegionalPaywallWindow): string[];
}

export class RegionalPaywallWindowRequiredRegionRule implements RegionalPaywallWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPaywallWindow): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPaywallWindowQuantityRangeRule implements RegionalPaywallWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPaywallWindow): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPaywallWindowRequiredTitleRule implements RegionalPaywallWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPaywallWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPaywallWindowExpiresAtRangeRule implements RegionalPaywallWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPaywallWindow): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional paywall window. */
export class RegionalPaywallWindowValidator {
  rules: RegionalPaywallWindowRule[];

  constructor(rules: RegionalPaywallWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPaywallWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPaywallWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPaywallWindow[]): Map<string, string[]> {
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

export function defaultRegionalPaywallWindowValidator(): RegionalPaywallWindowValidator {
  return new RegionalPaywallWindowValidator(
    [
      new RegionalPaywallWindowRequiredRegionRule("regional paywall window needs an entry"),
      new RegionalPaywallWindowQuantityRangeRule(64, 86400),
      new RegionalPaywallWindowRequiredTitleRule("regional paywall window needs this field"),
      new RegionalPaywallWindowExpiresAtRangeRule(32, 64),
    ],
  );
}
