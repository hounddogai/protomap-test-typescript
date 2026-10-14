import { EscalationAssignment } from "./escalation-assignment.js";

/** A rule a escalation assignment must pass. Check returns its problems, or none. */
export interface EscalationAssignmentRule {
  check(item: EscalationAssignment): string[];
}

export class EscalationAssignmentImpressionsRangeRule implements EscalationAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationAssignment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationAssignmentRequiredTitleRule implements EscalationAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAssignmentCodePrefixRule implements EscalationAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationAssignmentTitleLengthRule implements EscalationAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation assignment. */
export class EscalationAssignmentValidator {
  rules: EscalationAssignmentRule[];

  constructor(rules: EscalationAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationAssignment): string[] {
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

  requireValid(item: EscalationAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationAssignment[]): Map<string, string[]> {
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

export function defaultEscalationAssignmentValidator(): EscalationAssignmentValidator {
  return new EscalationAssignmentValidator(
    [
      new EscalationAssignmentImpressionsRangeRule(16, 32),
      new EscalationAssignmentRequiredTitleRule("escalation assignment needs this field"),
      new EscalationAssignmentCodePrefixRule("OPS"),
      new EscalationAssignmentTitleLengthRule(16),
    ],
  );
}
