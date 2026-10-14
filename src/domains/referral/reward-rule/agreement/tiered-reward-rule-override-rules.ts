import { TieredRewardRuleOverride } from "./tiered-reward-rule-override.js";

/** A rule a tiered reward rule override must pass. Check returns its problems, or none. */
export interface TieredRewardRuleOverrideRule {
  check(item: TieredRewardRuleOverride): string[];
}

export class TieredRewardRuleOverrideRequiredCodeRule implements TieredRewardRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleOverrideRequiredSourceRule implements TieredRewardRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleOverride): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleOverrideMarginRangeRule implements TieredRewardRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleOverride): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredRewardRuleOverrideCodePrefixRule implements TieredRewardRuleOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredRewardRuleOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered reward rule override. */
export class TieredRewardRuleOverrideValidator {
  rules: TieredRewardRuleOverrideRule[];

  constructor(rules: TieredRewardRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardRuleOverride): string[] {
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

  requireValid(item: TieredRewardRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardRuleOverride[]): Map<string, string[]> {
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

export function defaultTieredRewardRuleOverrideValidator(): TieredRewardRuleOverrideValidator {
  return new TieredRewardRuleOverrideValidator(
    [
      new TieredRewardRuleOverrideRequiredCodeRule("tiered reward rule override needs a value"),
      new TieredRewardRuleOverrideRequiredSourceRule("tiered reward rule override needs an entry"),
      new TieredRewardRuleOverrideMarginRangeRule(4.3, 113.2),
      new TieredRewardRuleOverrideCodePrefixRule("ACM"),
    ],
  );
}
