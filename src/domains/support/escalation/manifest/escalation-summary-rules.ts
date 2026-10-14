import { EscalationSummary } from "./escalation-summary.js";

/** A rule a escalation summary must pass. Check returns its problems, or none. */
export interface EscalationSummaryRule {
  check(item: EscalationSummary): string[];
}

export class EscalationSummaryCodeLengthRule implements EscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationSummaryPriorityRangeRule implements EscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationSummary): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationSummaryLabelLengthRule implements EscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationSummaryCodePrefixRule implements EscalationSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationSummaryVariantLengthRule implements EscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationSummary): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation summary. */
export class EscalationSummaryValidator {
  rules: EscalationSummaryRule[];

  constructor(rules: EscalationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationSummary[]): Map<string, string[]> {
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

export function defaultEscalationSummaryValidator(): EscalationSummaryValidator {
  return new EscalationSummaryValidator(
    [
      new EscalationSummaryCodeLengthRule(80),
      new EscalationSummaryPriorityRangeRule(64, 86400),
      new EscalationSummaryLabelLengthRule(120),
      new EscalationSummaryCodePrefixRule("REF"),
      new EscalationSummaryVariantLengthRule(80),
    ],
  );
}
