import * as text from "../../../../kit/text.js";
import { MentionAllocation } from "./mention-allocation.js";

/** A rule a mention allocation must pass. Check returns its problems, or none. */
export interface MentionAllocationRule {
  check(item: MentionAllocation): string[];
}

export class MentionAllocationNameLengthRule implements MentionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionAllocationAllowedNameRule implements MentionAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class MentionAllocationWeightRangeRule implements MentionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionAllocation): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionAllocationCodeLengthRule implements MentionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionAllocationUtmSourceLengthRule implements MentionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAllocation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionAllocationEndsAtRangeRule implements MentionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionAllocation): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a mention allocation. */
export class MentionAllocationValidator {
  rules: MentionAllocationRule[];

  constructor(rules: MentionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: MentionAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionAllocation[]): Map<string, string[]> {
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

export function defaultMentionAllocationValidator(): MentionAllocationValidator {
  return new MentionAllocationValidator(
    [
      new MentionAllocationNameLengthRule(32),
      new MentionAllocationAllowedNameRule(["lenient", "global", "capped"]),
      new MentionAllocationWeightRangeRule(3.5, 2356.4),
      new MentionAllocationCodeLengthRule(3600),
      new MentionAllocationUtmSourceLengthRule(86400),
      new MentionAllocationEndsAtRangeRule(64, 255),
    ],
  );
}
