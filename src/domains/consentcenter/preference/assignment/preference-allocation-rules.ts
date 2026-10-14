import * as text from "../../../../kit/text.js";
import { PreferenceAllocation } from "./preference-allocation.js";

/** A rule a preference allocation must pass. Check returns its problems, or none. */
export interface PreferenceAllocationRule {
  check(item: PreferenceAllocation): string[];
}

export class PreferenceAllocationRequiredRegionRule implements PreferenceAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceAllocation): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceAllocationNameLengthRule implements PreferenceAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceAllocationUpdatedAtRangeRule implements PreferenceAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceAllocation): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceAllocationAllowedCodeRule implements PreferenceAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

/** Runs every rule of a preference allocation. */
export class PreferenceAllocationValidator {
  rules: PreferenceAllocationRule[];

  constructor(rules: PreferenceAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceAllocation): string[] {
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

  requireValid(item: PreferenceAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceAllocation[]): Map<string, string[]> {
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

export function defaultPreferenceAllocationValidator(): PreferenceAllocationValidator {
  return new PreferenceAllocationValidator(
    [
      new PreferenceAllocationRequiredRegionRule("preference allocation needs an entry"),
      new PreferenceAllocationNameLengthRule(64),
      new PreferenceAllocationUpdatedAtRangeRule(80, 86400),
      new PreferenceAllocationAllowedCodeRule(["regional"]),
    ],
  );
}
