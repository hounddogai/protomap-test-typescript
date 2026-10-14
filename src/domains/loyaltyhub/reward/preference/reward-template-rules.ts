import { RewardTemplate } from "./reward-template.js";

/** A rule a reward template must pass. Check returns its problems, or none. */
export interface RewardTemplateRule {
  check(item: RewardTemplate): string[];
}

export class RewardTemplateAttemptsRangeRule implements RewardTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardTemplate): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardTemplateRateRangeRule implements RewardTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardTemplate): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardTemplateSequenceRangeRule implements RewardTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardTemplate): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardTemplateCodePrefixRule implements RewardTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardTemplateRequiredLabelRule implements RewardTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardTemplateRequiredCodeRule implements RewardTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward template. */
export class RewardTemplateValidator {
  rules: RewardTemplateRule[];

  constructor(rules: RewardTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RewardTemplate): string[] {
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

  requireValid(item: RewardTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardTemplate[]): Map<string, string[]> {
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

export function defaultRewardTemplateValidator(): RewardTemplateValidator {
  return new RewardTemplateValidator(
    [
      new RewardTemplateAttemptsRangeRule(120, 86400),
      new RewardTemplateRateRangeRule(0.4, 4537.6),
      new RewardTemplateSequenceRangeRule(16, 80),
      new RewardTemplateCodePrefixRule("X"),
      new RewardTemplateRequiredLabelRule("reward template needs this field"),
      new RewardTemplateRequiredCodeRule("reward template needs an entry"),
    ],
  );
}
