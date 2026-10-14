import { RewardRuleOverride } from "./reward-rule-override.js";

/** A rule a reward rule override must pass. Check returns its problems, or none. */
export interface RewardRuleOverrideRule {
  check(item: RewardRuleOverride): string[];
}

export class RewardRuleOverrideCodeLengthRule implements RewardRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleOverrideRequiredCodeRule implements RewardRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleOverrideRegionLengthRule implements RewardRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleOverride): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleOverrideRevisionRangeRule implements RewardRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleOverride): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleOverrideRequiredRegionRule implements RewardRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleOverride): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule override. */
export class RewardRuleOverrideValidator {
  rules: RewardRuleOverrideRule[];

  constructor(rules: RewardRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleOverride[]): Map<string, string[]> {
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

export function defaultRewardRuleOverrideValidator(): RewardRuleOverrideValidator {
  return new RewardRuleOverrideValidator(
    [
      new RewardRuleOverrideCodeLengthRule(120),
      new RewardRuleOverrideRequiredCodeRule("reward rule override needs this field"),
      new RewardRuleOverrideRegionLengthRule(120),
      new RewardRuleOverrideRevisionRangeRule(32, 80),
      new RewardRuleOverrideRequiredRegionRule("reward rule override needs a value"),
    ],
  );
}
