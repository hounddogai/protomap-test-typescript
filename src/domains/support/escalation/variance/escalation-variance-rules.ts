import * as text from "../../../../kit/text.js";
import { EscalationVariance } from "./escalation-variance.js";

/** A rule a escalation variance must pass. Check returns its problems, or none. */
export interface EscalationVarianceRule {
  check(item: EscalationVariance): string[];
}

export class EscalationVarianceDurationMinutesRangeRule implements EscalationVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationVariance): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationVarianceCodePrefixRule implements EscalationVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationVarianceRequiredCodeRule implements EscalationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationVarianceAllowedTitleRule implements EscalationVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class EscalationVarianceExpiresAtRangeRule implements EscalationVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationVariance): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationVarianceRequiredCountryRule implements EscalationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationVariance): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation variance. */
export class EscalationVarianceValidator {
  rules: EscalationVarianceRule[];

  constructor(rules: EscalationVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationVariance[]): Map<string, string[]> {
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

export function defaultEscalationVarianceValidator(): EscalationVarianceValidator {
  return new EscalationVarianceValidator(
    [
      new EscalationVarianceDurationMinutesRangeRule(255, 86400),
      new EscalationVarianceCodePrefixRule("OPS"),
      new EscalationVarianceRequiredCodeRule("escalation variance needs this field"),
      new EscalationVarianceAllowedTitleRule(["scheduled", "strict"]),
      new EscalationVarianceExpiresAtRangeRule(1000, 86400),
      new EscalationVarianceRequiredCountryRule("escalation variance needs a value"),
    ],
  );
}
