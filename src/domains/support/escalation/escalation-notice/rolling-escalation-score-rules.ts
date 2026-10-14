import { RollingEscalationScore } from "./rolling-escalation-score.js";

/** A rule a rolling escalation score must pass. Check returns its problems, or none. */
export interface RollingEscalationScoreRule {
  check(item: RollingEscalationScore): string[];
}

export class RollingEscalationScoreCodeLengthRule implements RollingEscalationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingEscalationScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingEscalationScoreVariantLengthRule implements RollingEscalationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingEscalationScore): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingEscalationScoreTimezoneLengthRule implements RollingEscalationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingEscalationScore): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingEscalationScoreEndsAtRangeRule implements RollingEscalationScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingEscalationScore): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling escalation score. */
export class RollingEscalationScoreValidator {
  rules: RollingEscalationScoreRule[];

  constructor(rules: RollingEscalationScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RollingEscalationScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingEscalationScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingEscalationScore[]): Map<string, string[]> {
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

export function defaultRollingEscalationScoreValidator(): RollingEscalationScoreValidator {
  return new RollingEscalationScoreValidator(
    [
      new RollingEscalationScoreCodeLengthRule(32),
      new RollingEscalationScoreVariantLengthRule(3600),
      new RollingEscalationScoreTimezoneLengthRule(255),
      new RollingEscalationScoreEndsAtRangeRule(16, 120),
    ],
  );
}
