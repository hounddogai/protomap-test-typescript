import { GlobalRewardRuleBundle } from "./global-reward-rule-bundle.js";

/** A rule a global reward rule bundle must pass. Check returns its problems, or none. */
export interface GlobalRewardRuleBundleRule {
  check(item: GlobalRewardRuleBundle): string[];
}

export class GlobalRewardRuleBundleRequiredNameRule implements GlobalRewardRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleBundleFloorValueRangeRule implements GlobalRewardRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardRuleBundle): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRewardRuleBundleUpdatedAtRangeRule implements GlobalRewardRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardRuleBundle): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRewardRuleBundleCodePrefixRule implements GlobalRewardRuleBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRewardRuleBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global reward rule bundle. */
export class GlobalRewardRuleBundleValidator {
  rules: GlobalRewardRuleBundleRule[];

  constructor(rules: GlobalRewardRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardRuleBundle): string[] {
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

  requireValid(item: GlobalRewardRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardRuleBundle[]): Map<string, string[]> {
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

export function defaultGlobalRewardRuleBundleValidator(): GlobalRewardRuleBundleValidator {
  return new GlobalRewardRuleBundleValidator(
    [
      new GlobalRewardRuleBundleRequiredNameRule("global reward rule bundle needs this field"),
      new GlobalRewardRuleBundleFloorValueRangeRule(0.1, 4665.5),
      new GlobalRewardRuleBundleUpdatedAtRangeRule(32, 1000),
      new GlobalRewardRuleBundleCodePrefixRule("ACM"),
    ],
  );
}
