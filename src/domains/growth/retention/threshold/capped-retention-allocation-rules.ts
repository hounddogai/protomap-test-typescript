import * as text from "../../../../kit/text.js";
import { CappedRetentionAllocation } from "./capped-retention-allocation.js";

/** A rule a capped retention allocation must pass. Check returns its problems, or none. */
export interface CappedRetentionAllocationRule {
  check(item: CappedRetentionAllocation): string[];
}

export class CappedRetentionAllocationAllowedJourneyIdRule implements CappedRetentionAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedRetentionAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is blocked`];
    return [];
  }
}

export class CappedRetentionAllocationQuantityRangeRule implements CappedRetentionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRetentionAllocation): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedRetentionAllocationAudienceIdLengthRule implements CappedRetentionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRetentionAllocation): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedRetentionAllocationRequiredCodeRule implements CappedRetentionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRetentionAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRetentionAllocationRequiredLabelRule implements CappedRetentionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRetentionAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped retention allocation. */
export class CappedRetentionAllocationValidator {
  rules: CappedRetentionAllocationRule[];

  constructor(rules: CappedRetentionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRetentionAllocation): string[] {
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

  requireValid(item: CappedRetentionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRetentionAllocation[]): Map<string, string[]> {
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

export function defaultCappedRetentionAllocationValidator(): CappedRetentionAllocationValidator {
  return new CappedRetentionAllocationValidator(
    [
      new CappedRetentionAllocationAllowedJourneyIdRule(["default"]),
      new CappedRetentionAllocationQuantityRangeRule(16, 86400),
      new CappedRetentionAllocationAudienceIdLengthRule(64),
      new CappedRetentionAllocationRequiredCodeRule("capped retention allocation needs an entry"),
      new CappedRetentionAllocationRequiredLabelRule("capped retention allocation needs this field"),
    ],
  );
}
