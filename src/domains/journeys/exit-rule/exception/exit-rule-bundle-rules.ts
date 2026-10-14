import { ExitRuleBundle } from "./exit-rule-bundle.js";

/** A rule a exit rule bundle must pass. Check returns its problems, or none. */
export interface ExitRuleBundleRule {
  check(item: ExitRuleBundle): string[];
}

export class ExitRuleBundleApprovedGuardRule implements ExitRuleBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ExitRuleBundle): string[] {
    if (item.approved && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ExitRuleBundlePriorityRangeRule implements ExitRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleBundle): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleBundleRequiredNameRule implements ExitRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleBundleWeightRangeRule implements ExitRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleBundle): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleBundleRequiredChannelRule implements ExitRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleBundle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule bundle. */
export class ExitRuleBundleValidator {
  rules: ExitRuleBundleRule[];

  constructor(rules: ExitRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleBundle): string[] {
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

  requireValid(item: ExitRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleBundle[]): Map<string, string[]> {
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

export function defaultExitRuleBundleValidator(): ExitRuleBundleValidator {
  return new ExitRuleBundleValidator(
    [
      new ExitRuleBundleApprovedGuardRule(80),
      new ExitRuleBundlePriorityRangeRule(64, 80),
      new ExitRuleBundleRequiredNameRule("exit rule bundle needs this field"),
      new ExitRuleBundleWeightRangeRule(5.6, 2616.7),
      new ExitRuleBundleRequiredChannelRule("exit rule bundle needs a value"),
    ],
  );
}
