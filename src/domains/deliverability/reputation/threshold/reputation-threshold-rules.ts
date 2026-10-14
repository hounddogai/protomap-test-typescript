import { ReputationThreshold } from "./reputation-threshold.js";

/** A rule a reputation threshold must pass. Check returns its problems, or none. */
export interface ReputationThresholdRule {
  check(item: ReputationThreshold): string[];
}

export class ReputationThresholdRequiredCodeRule implements ReputationThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationThresholdLabelLengthRule implements ReputationThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationThresholdCodePrefixRule implements ReputationThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReputationThresholdAttemptsRangeRule implements ReputationThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationThreshold): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationThresholdWeightRangeRule implements ReputationThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationThreshold): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationThresholdCodeLengthRule implements ReputationThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation threshold. */
export class ReputationThresholdValidator {
  rules: ReputationThresholdRule[];

  constructor(rules: ReputationThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationThreshold): string[] {
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

  requireValid(item: ReputationThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationThreshold[]): Map<string, string[]> {
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

export function defaultReputationThresholdValidator(): ReputationThresholdValidator {
  return new ReputationThresholdValidator(
    [
      new ReputationThresholdRequiredCodeRule("reputation threshold needs a value"),
      new ReputationThresholdLabelLengthRule(80),
      new ReputationThresholdCodePrefixRule("ACM"),
      new ReputationThresholdAttemptsRangeRule(86400, 86400),
      new ReputationThresholdWeightRangeRule(6.4, 3089.8),
      new ReputationThresholdCodeLengthRule(86400),
    ],
  );
}
