import { QueueAllocation } from "./queue-allocation.js";

/** A rule a queue allocation must pass. Check returns its problems, or none. */
export interface QueueAllocationRule {
  check(item: QueueAllocation): string[];
}

export class QueueAllocationCodePrefixRule implements QueueAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueAllocationVisibleGuardRule implements QueueAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: QueueAllocation): string[] {
    if (item.visible && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class QueueAllocationTitleLengthRule implements QueueAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue allocation. */
export class QueueAllocationValidator {
  rules: QueueAllocationRule[];

  constructor(rules: QueueAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: QueueAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueAllocation[]): Map<string, string[]> {
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

export function defaultQueueAllocationValidator(): QueueAllocationValidator {
  return new QueueAllocationValidator(
    [
      new QueueAllocationCodePrefixRule("X"),
      new QueueAllocationVisibleGuardRule(7.4),
      new QueueAllocationTitleLengthRule(3600),
    ],
  );
}
