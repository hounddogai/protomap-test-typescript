import { EscalationBatch } from "./escalation-batch.js";

/** A rule a escalation batch must pass. Check returns its problems, or none. */
export interface EscalationBatchRule {
  check(item: EscalationBatch): string[];
}

export class EscalationBatchCodePrefixRule implements EscalationBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationBatchRequiredCodeRule implements EscalationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationBatchRequiredNotesRule implements EscalationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationBatch): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationBatchTitleLengthRule implements EscalationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationBatchCeilingRangeRule implements EscalationBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationBatch): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationBatchVisibleGuardRule implements EscalationBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EscalationBatch): string[] {
    if (item.visible && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a escalation batch. */
export class EscalationBatchValidator {
  rules: EscalationBatchRule[];

  constructor(rules: EscalationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationBatch): string[] {
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

  requireValid(item: EscalationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationBatch[]): Map<string, string[]> {
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

export function defaultEscalationBatchValidator(): EscalationBatchValidator {
  return new EscalationBatchValidator(
    [
      new EscalationBatchCodePrefixRule("ACM"),
      new EscalationBatchRequiredCodeRule("escalation batch needs this field"),
      new EscalationBatchRequiredNotesRule("escalation batch needs a value"),
      new EscalationBatchTitleLengthRule(1000),
      new EscalationBatchCeilingRangeRule(2.3, 2839.9),
      new EscalationBatchVisibleGuardRule(1.1),
    ],
  );
}
