import { LegacyEscalationException } from "./legacy-escalation-exception.js";

/** A rule a legacy escalation exception must pass. Check returns its problems, or none. */
export interface LegacyEscalationExceptionRule {
  check(item: LegacyEscalationException): string[];
}

export class LegacyEscalationExceptionClicksRangeRule implements LegacyEscalationExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyEscalationException): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyEscalationExceptionRequiredNameRule implements LegacyEscalationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEscalationException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEscalationExceptionUtmSourceLengthRule implements LegacyEscalationExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyEscalationException): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy escalation exception. */
export class LegacyEscalationExceptionValidator {
  rules: LegacyEscalationExceptionRule[];

  constructor(rules: LegacyEscalationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyEscalationException): string[] {
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

  requireValid(item: LegacyEscalationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyEscalationException[]): Map<string, string[]> {
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

export function defaultLegacyEscalationExceptionValidator(): LegacyEscalationExceptionValidator {
  return new LegacyEscalationExceptionValidator(
    [
      new LegacyEscalationExceptionClicksRangeRule(80, 120),
      new LegacyEscalationExceptionRequiredNameRule("legacy escalation exception needs an entry"),
      new LegacyEscalationExceptionUtmSourceLengthRule(1000),
    ],
  );
}
