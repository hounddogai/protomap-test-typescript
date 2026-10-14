import { QueueGroup } from "./queue-group.js";

/** A rule a queue group must pass. Check returns its problems, or none. */
export interface QueueGroupRule {
  check(item: QueueGroup): string[];
}

export class QueueGroupCodeLengthRule implements QueueGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueGroupCodePrefixRule implements QueueGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class QueueGroupRequiredCodeRule implements QueueGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueGroupLabelLengthRule implements QueueGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueGroupFloorValueRangeRule implements QueueGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueGroup): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueGroupRequiredLabelRule implements QueueGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue group. */
export class QueueGroupValidator {
  rules: QueueGroupRule[];

  constructor(rules: QueueGroupRule[]) {
    this.rules = rules;
  }

  validate(item: QueueGroup): string[] {
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

  requireValid(item: QueueGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueGroup[]): Map<string, string[]> {
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

export function defaultQueueGroupValidator(): QueueGroupValidator {
  return new QueueGroupValidator(
    [
      new QueueGroupCodeLengthRule(1000),
      new QueueGroupCodePrefixRule("REF"),
      new QueueGroupRequiredCodeRule("queue group needs a value"),
      new QueueGroupLabelLengthRule(255),
      new QueueGroupFloorValueRangeRule(5.5, 1956.6),
      new QueueGroupRequiredLabelRule("queue group needs a value"),
    ],
  );
}
