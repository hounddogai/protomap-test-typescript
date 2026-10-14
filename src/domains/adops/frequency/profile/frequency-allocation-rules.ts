import * as text from "../../../../kit/text.js";
import { FrequencyAllocation } from "./frequency-allocation.js";

/** A rule a frequency allocation must pass. Check returns its problems, or none. */
export interface FrequencyAllocationRule {
  check(item: FrequencyAllocation): string[];
}

export class FrequencyAllocationSegmentLengthRule implements FrequencyAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyAllocation): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyAllocationRequiredSegmentRule implements FrequencyAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyAllocation): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyAllocationCodePrefixRule implements FrequencyAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyAllocationRequiredCodeRule implements FrequencyAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyAllocationJourneyIdLengthRule implements FrequencyAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyAllocation): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyAllocationAllowedLocaleRule implements FrequencyAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

/** Runs every rule of a frequency allocation. */
export class FrequencyAllocationValidator {
  rules: FrequencyAllocationRule[];

  constructor(rules: FrequencyAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyAllocation[]): Map<string, string[]> {
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

export function defaultFrequencyAllocationValidator(): FrequencyAllocationValidator {
  return new FrequencyAllocationValidator(
    [
      new FrequencyAllocationSegmentLengthRule(32),
      new FrequencyAllocationRequiredSegmentRule("frequency allocation needs an entry"),
      new FrequencyAllocationCodePrefixRule("Q"),
      new FrequencyAllocationRequiredCodeRule("frequency allocation needs an entry"),
      new FrequencyAllocationJourneyIdLengthRule(64),
      new FrequencyAllocationAllowedLocaleRule(["legacy"]),
    ],
  );
}
