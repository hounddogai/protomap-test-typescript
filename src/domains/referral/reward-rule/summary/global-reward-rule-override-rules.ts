import { GlobalRewardRuleOverride } from "./global-reward-rule-override.js";

/** A rule a global reward rule override must pass. Check returns its problems, or none. */
export interface GlobalRewardRuleOverrideRule {
  check(item: GlobalRewardRuleOverride): string[];
}

export class GlobalRewardRuleOverrideDiscountRangeRule implements GlobalRewardRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardRuleOverride): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalRewardRuleOverrideRequiredCodeRule implements GlobalRewardRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleOverrideRequiredNameRule implements GlobalRewardRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleOverrideCodePrefixRule implements GlobalRewardRuleOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRewardRuleOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalRewardRuleOverrideCodeLengthRule implements GlobalRewardRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardRuleOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardRuleOverrideNameLengthRule implements GlobalRewardRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardRuleOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global reward rule override. */
export class GlobalRewardRuleOverrideValidator {
  rules: GlobalRewardRuleOverrideRule[];

  constructor(rules: GlobalRewardRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardRuleOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRewardRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardRuleOverride[]): Map<string, string[]> {
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

export function defaultGlobalRewardRuleOverrideValidator(): GlobalRewardRuleOverrideValidator {
  return new GlobalRewardRuleOverrideValidator(
    [
      new GlobalRewardRuleOverrideDiscountRangeRule(0.9, 2131.9),
      new GlobalRewardRuleOverrideRequiredCodeRule("global reward rule override needs this field"),
      new GlobalRewardRuleOverrideRequiredNameRule("global reward rule override needs this field"),
      new GlobalRewardRuleOverrideCodePrefixRule("REF"),
      new GlobalRewardRuleOverrideCodeLengthRule(255),
      new GlobalRewardRuleOverrideNameLengthRule(64),
    ],
  );
}
