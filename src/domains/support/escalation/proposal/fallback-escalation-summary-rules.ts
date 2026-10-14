import { FallbackEscalationSummary } from "./fallback-escalation-summary.js";

/** A rule a fallback escalation summary must pass. Check returns its problems, or none. */
export interface FallbackEscalationSummaryRule {
  check(item: FallbackEscalationSummary): string[];
}

export class FallbackEscalationSummaryAttemptsRangeRule implements FallbackEscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackEscalationSummary): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackEscalationSummaryNameLengthRule implements FallbackEscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackEscalationSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackEscalationSummaryCodePrefixRule implements FallbackEscalationSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackEscalationSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackEscalationSummaryPriorityRangeRule implements FallbackEscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackEscalationSummary): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackEscalationSummaryTitleLengthRule implements FallbackEscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackEscalationSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback escalation summary. */
export class FallbackEscalationSummaryValidator {
  rules: FallbackEscalationSummaryRule[];

  constructor(rules: FallbackEscalationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackEscalationSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackEscalationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackEscalationSummary[]): Map<string, string[]> {
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

export function defaultFallbackEscalationSummaryValidator(): FallbackEscalationSummaryValidator {
  return new FallbackEscalationSummaryValidator(
    [
      new FallbackEscalationSummaryAttemptsRangeRule(16, 3600),
      new FallbackEscalationSummaryNameLengthRule(64),
      new FallbackEscalationSummaryCodePrefixRule("REF"),
      new FallbackEscalationSummaryPriorityRangeRule(80, 255),
      new FallbackEscalationSummaryTitleLengthRule(16),
    ],
  );
}
