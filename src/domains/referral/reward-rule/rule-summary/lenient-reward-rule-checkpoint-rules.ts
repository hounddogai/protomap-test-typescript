import { LenientRewardRuleCheckpoint } from "./lenient-reward-rule-checkpoint.js";

/** A rule a lenient reward rule checkpoint must pass. Check returns its problems, or none. */
export interface LenientRewardRuleCheckpointRule {
  check(item: LenientRewardRuleCheckpoint): string[];
}

export class LenientRewardRuleCheckpointTitleLengthRule implements LenientRewardRuleCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardRuleCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardRuleCheckpointRequiredCodeRule implements LenientRewardRuleCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRewardRuleCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRewardRuleCheckpointCodePrefixRule implements LenientRewardRuleCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientRewardRuleCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientRewardRuleCheckpointMaximumRangeRule implements LenientRewardRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardRuleCheckpoint): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientRewardRuleCheckpointAmountRangeRule implements LenientRewardRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardRuleCheckpoint): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientRewardRuleCheckpointApprovedGuardRule implements LenientRewardRuleCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientRewardRuleCheckpoint): string[] {
    if (item.approved && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a lenient reward rule checkpoint. */
export class LenientRewardRuleCheckpointValidator {
  rules: LenientRewardRuleCheckpointRule[];

  constructor(rules: LenientRewardRuleCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardRuleCheckpoint): string[] {
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

  requireValid(item: LenientRewardRuleCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardRuleCheckpoint[]): Map<string, string[]> {
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

export function defaultLenientRewardRuleCheckpointValidator(): LenientRewardRuleCheckpointValidator {
  return new LenientRewardRuleCheckpointValidator(
    [
      new LenientRewardRuleCheckpointTitleLengthRule(32),
      new LenientRewardRuleCheckpointRequiredCodeRule("lenient reward rule checkpoint needs this field"),
      new LenientRewardRuleCheckpointCodePrefixRule("Q"),
      new LenientRewardRuleCheckpointMaximumRangeRule(7.5, 1793),
      new LenientRewardRuleCheckpointAmountRangeRule(2, 320.2),
      new LenientRewardRuleCheckpointApprovedGuardRule(1.2),
    ],
  );
}
