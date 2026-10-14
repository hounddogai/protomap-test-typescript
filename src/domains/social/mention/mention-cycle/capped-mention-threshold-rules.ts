import { CappedMentionThreshold } from "./capped-mention-threshold.js";

/** A rule a capped mention threshold must pass. Check returns its problems, or none. */
export interface CappedMentionThresholdRule {
  check(item: CappedMentionThreshold): string[];
}

export class CappedMentionThresholdDiscountRangeRule implements CappedMentionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedMentionThreshold): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedMentionThresholdFrequencyCapRangeRule implements CappedMentionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedMentionThreshold): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedMentionThresholdRequiredSummaryRule implements CappedMentionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionThreshold): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class CappedMentionThresholdRequiredNameRule implements CappedMentionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped mention threshold. */
export class CappedMentionThresholdValidator {
  rules: CappedMentionThresholdRule[];

  constructor(rules: CappedMentionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CappedMentionThreshold): string[] {
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

  requireValid(item: CappedMentionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedMentionThreshold[]): Map<string, string[]> {
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

export function defaultCappedMentionThresholdValidator(): CappedMentionThresholdValidator {
  return new CappedMentionThresholdValidator(
    [
      new CappedMentionThresholdDiscountRangeRule(4.9, 1381.7),
      new CappedMentionThresholdFrequencyCapRangeRule(32, 32),
      new CappedMentionThresholdRequiredSummaryRule("capped mention threshold needs this field"),
      new CappedMentionThresholdRequiredNameRule("capped mention threshold needs an entry"),
    ],
  );
}
