import * as text from "../../../../kit/text.js";
import { FallbackRewardRuleAdjustment } from "./fallback-reward-rule-adjustment.js";

/** A rule a fallback reward rule adjustment must pass. Check returns its problems, or none. */
export interface FallbackRewardRuleAdjustmentRule {
  check(item: FallbackRewardRuleAdjustment): string[];
}

export class FallbackRewardRuleAdjustmentCreatedAtRangeRule implements FallbackRewardRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRewardRuleAdjustment): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackRewardRuleAdjustmentContactEmailLengthRule implements FallbackRewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardRuleAdjustment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRewardRuleAdjustmentRequiredDescriptionRule implements FallbackRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardRuleAdjustment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardRuleAdjustmentAllowedCodeRule implements FallbackRewardRuleAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackRewardRuleAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class FallbackRewardRuleAdjustmentRequiredCodeRule implements FallbackRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardRuleAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardRuleAdjustmentRequiredNameRule implements FallbackRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardRuleAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback reward rule adjustment. */
export class FallbackRewardRuleAdjustmentValidator {
  rules: FallbackRewardRuleAdjustmentRule[];

  constructor(rules: FallbackRewardRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardRuleAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRewardRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardRuleAdjustment[]): Map<string, string[]> {
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

export function defaultFallbackRewardRuleAdjustmentValidator(): FallbackRewardRuleAdjustmentValidator {
  return new FallbackRewardRuleAdjustmentValidator(
    [
      new FallbackRewardRuleAdjustmentCreatedAtRangeRule(80, 120),
      new FallbackRewardRuleAdjustmentContactEmailLengthRule(16),
      new FallbackRewardRuleAdjustmentRequiredDescriptionRule("fallback reward rule adjustment needs a value"),
      new FallbackRewardRuleAdjustmentAllowedCodeRule([]),
      new FallbackRewardRuleAdjustmentRequiredCodeRule("fallback reward rule adjustment needs an entry"),
      new FallbackRewardRuleAdjustmentRequiredNameRule("fallback reward rule adjustment needs this field"),
    ],
  );
}
