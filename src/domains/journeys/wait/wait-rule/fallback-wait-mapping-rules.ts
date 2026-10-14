import * as text from "../../../../kit/text.js";
import { FallbackWaitMapping } from "./fallback-wait-mapping.js";

/** A rule a fallback wait mapping must pass. Check returns its problems, or none. */
export interface FallbackWaitMappingRule {
  check(item: FallbackWaitMapping): string[];
}

export class FallbackWaitMappingRequiredSegmentRule implements FallbackWaitMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWaitMapping): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWaitMappingRequiredLabelRule implements FallbackWaitMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWaitMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWaitMappingClicksRangeRule implements FallbackWaitMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackWaitMapping): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackWaitMappingArchivedGuardRule implements FallbackWaitMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackWaitMapping): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FallbackWaitMappingRequiredCodeRule implements FallbackWaitMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWaitMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWaitMappingAllowedLabelRule implements FallbackWaitMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackWaitMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

/** Runs every rule of a fallback wait mapping. */
export class FallbackWaitMappingValidator {
  rules: FallbackWaitMappingRule[];

  constructor(rules: FallbackWaitMappingRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackWaitMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackWaitMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackWaitMapping[]): Map<string, string[]> {
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

export function defaultFallbackWaitMappingValidator(): FallbackWaitMappingValidator {
  return new FallbackWaitMappingValidator(
    [
      new FallbackWaitMappingRequiredSegmentRule("fallback wait mapping needs this field"),
      new FallbackWaitMappingRequiredLabelRule("fallback wait mapping needs this field"),
      new FallbackWaitMappingClicksRangeRule(120, 86400),
      new FallbackWaitMappingArchivedGuardRule(2.1),
      new FallbackWaitMappingRequiredCodeRule("fallback wait mapping needs an entry"),
      new FallbackWaitMappingAllowedLabelRule(["seasonal", "scheduled"]),
    ],
  );
}
