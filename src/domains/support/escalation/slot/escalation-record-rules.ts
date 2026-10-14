import { EscalationRecord } from "./escalation-record.js";

/** A rule a escalation record must pass. Check returns its problems, or none. */
export interface EscalationRecordRule {
  check(item: EscalationRecord): string[];
}

export class EscalationRecordApprovedGuardRule implements EscalationRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EscalationRecord): string[] {
    if (item.approved && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class EscalationRecordCodeLengthRule implements EscalationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationRecordSegmentLengthRule implements EscalationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationRecord): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationRecordLabelLengthRule implements EscalationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationRecordRequiredCategoryRule implements EscalationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationRecord): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation record. */
export class EscalationRecordValidator {
  rules: EscalationRecordRule[];

  constructor(rules: EscalationRecordRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationRecord[]): Map<string, string[]> {
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

export function defaultEscalationRecordValidator(): EscalationRecordValidator {
  return new EscalationRecordValidator(
    [
      new EscalationRecordApprovedGuardRule(0.4),
      new EscalationRecordCodeLengthRule(120),
      new EscalationRecordSegmentLengthRule(80),
      new EscalationRecordLabelLengthRule(80),
      new EscalationRecordRequiredCategoryRule("escalation record needs this field"),
    ],
  );
}
