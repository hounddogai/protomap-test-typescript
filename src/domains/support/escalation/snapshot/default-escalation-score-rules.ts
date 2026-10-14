import { DefaultEscalationScore } from "./default-escalation-score.js";

/** A rule a default escalation score must pass. Check returns its problems, or none. */
export interface DefaultEscalationScoreRule {
  check(item: DefaultEscalationScore): string[];
}

export class DefaultEscalationScoreRequiredCodeRule implements DefaultEscalationScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultEscalationScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultEscalationScoreAudienceIdLengthRule implements DefaultEscalationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEscalationScore): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultEscalationScoreAmountRangeRule implements DefaultEscalationScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEscalationScore): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultEscalationScoreNameLengthRule implements DefaultEscalationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEscalationScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default escalation score. */
export class DefaultEscalationScoreValidator {
  rules: DefaultEscalationScoreRule[];

  constructor(rules: DefaultEscalationScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultEscalationScore): string[] {
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

  requireValid(item: DefaultEscalationScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultEscalationScore[]): Map<string, string[]> {
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

export function defaultDefaultEscalationScoreValidator(): DefaultEscalationScoreValidator {
  return new DefaultEscalationScoreValidator(
    [
      new DefaultEscalationScoreRequiredCodeRule("default escalation score needs a value"),
      new DefaultEscalationScoreAudienceIdLengthRule(32),
      new DefaultEscalationScoreAmountRangeRule(8.2, 1745),
      new DefaultEscalationScoreNameLengthRule(3600),
    ],
  );
}
