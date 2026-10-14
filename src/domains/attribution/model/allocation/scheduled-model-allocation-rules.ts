import * as text from "../../../../kit/text.js";
import { ScheduledModelAllocation } from "./scheduled-model-allocation.js";

/** A rule a scheduled model allocation must pass. Check returns its problems, or none. */
export interface ScheduledModelAllocationRule {
  check(item: ScheduledModelAllocation): string[];
}

export class ScheduledModelAllocationRequiredPhoneRule implements ScheduledModelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledModelAllocation): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledModelAllocationAllowedNameRule implements ScheduledModelAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledModelAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class ScheduledModelAllocationCodeLengthRule implements ScheduledModelAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledModelAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledModelAllocationRequiredSummaryRule implements ScheduledModelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledModelAllocation): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled model allocation. */
export class ScheduledModelAllocationValidator {
  rules: ScheduledModelAllocationRule[];

  constructor(rules: ScheduledModelAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledModelAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledModelAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledModelAllocation[]): Map<string, string[]> {
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

export function defaultScheduledModelAllocationValidator(): ScheduledModelAllocationValidator {
  return new ScheduledModelAllocationValidator(
    [
      new ScheduledModelAllocationRequiredPhoneRule("scheduled model allocation needs a value"),
      new ScheduledModelAllocationAllowedNameRule([]),
      new ScheduledModelAllocationCodeLengthRule(80),
      new ScheduledModelAllocationRequiredSummaryRule("scheduled model allocation needs an entry"),
    ],
  );
}
