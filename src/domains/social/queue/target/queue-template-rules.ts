import { QueueTemplate } from "./queue-template.js";

/** A rule a queue template must pass. Check returns its problems, or none. */
export interface QueueTemplateRule {
  check(item: QueueTemplate): string[];
}

export class QueueTemplateEndsAtRangeRule implements QueueTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueTemplate): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueTemplateVisibleGuardRule implements QueueTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: QueueTemplate): string[] {
    if (item.visible && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class QueueTemplateUnitLengthRule implements QueueTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueTemplate): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue template. */
export class QueueTemplateValidator {
  rules: QueueTemplateRule[];

  constructor(rules: QueueTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: QueueTemplate): string[] {
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

  requireValid(item: QueueTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueTemplate[]): Map<string, string[]> {
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

export function defaultQueueTemplateValidator(): QueueTemplateValidator {
  return new QueueTemplateValidator(
    [
      new QueueTemplateEndsAtRangeRule(16, 80),
      new QueueTemplateVisibleGuardRule(86400),
      new QueueTemplateUnitLengthRule(80),
    ],
  );
}
