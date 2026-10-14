import { EscalationOverride } from "./escalation-override.js";

/** A rule a escalation override must pass. Check returns its problems, or none. */
export interface EscalationOverrideRule {
  check(item: EscalationOverride): string[];
}

export class EscalationOverrideRequiredReviewerRule implements EscalationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationOverride): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationOverrideCodeLengthRule implements EscalationOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationOverrideAmountRangeRule implements EscalationOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationOverride): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationOverrideRequiredNameRule implements EscalationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation override. */
export class EscalationOverrideValidator {
  rules: EscalationOverrideRule[];

  constructor(rules: EscalationOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationOverride[]): Map<string, string[]> {
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

export function defaultEscalationOverrideValidator(): EscalationOverrideValidator {
  return new EscalationOverrideValidator(
    [
      new EscalationOverrideRequiredReviewerRule("escalation override needs an entry"),
      new EscalationOverrideCodeLengthRule(64),
      new EscalationOverrideAmountRangeRule(2.9, 4598),
      new EscalationOverrideRequiredNameRule("escalation override needs a value"),
    ],
  );
}
