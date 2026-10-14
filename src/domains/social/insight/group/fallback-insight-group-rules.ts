import { FallbackInsightGroup } from "./fallback-insight-group.js";

/** A rule a fallback insight group must pass. Check returns its problems, or none. */
export interface FallbackInsightGroupRule {
  check(item: FallbackInsightGroup): string[];
}

export class FallbackInsightGroupCodeLengthRule implements FallbackInsightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInsightGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackInsightGroupRequiredLabelRule implements FallbackInsightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightGroupDurationMinutesRangeRule implements FallbackInsightGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackInsightGroup): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback insight group. */
export class FallbackInsightGroupValidator {
  rules: FallbackInsightGroupRule[];

  constructor(rules: FallbackInsightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInsightGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackInsightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInsightGroup[]): Map<string, string[]> {
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

export function defaultFallbackInsightGroupValidator(): FallbackInsightGroupValidator {
  return new FallbackInsightGroupValidator(
    [
      new FallbackInsightGroupCodeLengthRule(86400),
      new FallbackInsightGroupRequiredLabelRule("fallback insight group needs an entry"),
      new FallbackInsightGroupDurationMinutesRangeRule(32, 1000),
    ],
  );
}
