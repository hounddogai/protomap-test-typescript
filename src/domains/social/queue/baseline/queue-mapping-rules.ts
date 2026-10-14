import * as text from "../../../../kit/text.js";
import { QueueMapping } from "./queue-mapping.js";

/** A rule a queue mapping must pass. Check returns its problems, or none. */
export interface QueueMappingRule {
  check(item: QueueMapping): string[];
}

export class QueueMappingNameLengthRule implements QueueMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueMappingAllowedChecksumRule implements QueueMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is inconsistent`];
    return [];
  }
}

export class QueueMappingRequiredCodeRule implements QueueMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueMappingRequiredLabelRule implements QueueMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class QueueMappingBudgetRangeRule implements QueueMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueMapping): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a queue mapping. */
export class QueueMappingValidator {
  rules: QueueMappingRule[];

  constructor(rules: QueueMappingRule[]) {
    this.rules = rules;
  }

  validate(item: QueueMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueMapping[]): Map<string, string[]> {
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

export function defaultQueueMappingValidator(): QueueMappingValidator {
  return new QueueMappingValidator(
    [
      new QueueMappingNameLengthRule(16),
      new QueueMappingAllowedChecksumRule([]),
      new QueueMappingRequiredCodeRule("queue mapping needs a value"),
      new QueueMappingRequiredLabelRule("queue mapping needs an entry"),
      new QueueMappingBudgetRangeRule(2.9, 721.1),
    ],
  );
}
