import { EscalationException } from "./escalation-exception.js";

/** A rule a escalation exception must pass. Check returns its problems, or none. */
export interface EscalationExceptionRule {
  check(item: EscalationException): string[];
}

export class EscalationExceptionRequiredReviewerRule implements EscalationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationException): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationExceptionStartsAtRangeRule implements EscalationExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationException): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationExceptionOpenRateRangeRule implements EscalationExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationException): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationExceptionReviewerLengthRule implements EscalationExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationException): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationExceptionNameLengthRule implements EscalationExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationExceptionCodePrefixRule implements EscalationExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a escalation exception. */
export class EscalationExceptionValidator {
  rules: EscalationExceptionRule[];

  constructor(rules: EscalationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationException): string[] {
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

  requireValid(item: EscalationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationException[]): Map<string, string[]> {
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

export function defaultEscalationExceptionValidator(): EscalationExceptionValidator {
  return new EscalationExceptionValidator(
    [
      new EscalationExceptionRequiredReviewerRule("escalation exception needs an entry"),
      new EscalationExceptionStartsAtRangeRule(16, 120),
      new EscalationExceptionOpenRateRangeRule(8, 4986.5),
      new EscalationExceptionReviewerLengthRule(80),
      new EscalationExceptionNameLengthRule(86400),
      new EscalationExceptionCodePrefixRule("X"),
    ],
  );
}
