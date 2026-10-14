import * as text from "../../../../kit/text.js";
import { WaitOverride } from "./wait-override.js";

/** A rule a wait override must pass. Check returns its problems, or none. */
export interface WaitOverrideRule {
  check(item: WaitOverride): string[];
}

export class WaitOverrideAllowedLabelRule implements WaitOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class WaitOverrideSendAtRangeRule implements WaitOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitOverride): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitOverrideLabelLengthRule implements WaitOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitOverridePinnedGuardRule implements WaitOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WaitOverride): string[] {
    if (item.pinned && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a wait override. */
export class WaitOverrideValidator {
  rules: WaitOverrideRule[];

  constructor(rules: WaitOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: WaitOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitOverride[]): Map<string, string[]> {
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

export function defaultWaitOverrideValidator(): WaitOverrideValidator {
  return new WaitOverrideValidator(
    [
      new WaitOverrideAllowedLabelRule([]),
      new WaitOverrideSendAtRangeRule(120, 3600),
      new WaitOverrideLabelLengthRule(3600),
      new WaitOverridePinnedGuardRule(2.6),
    ],
  );
}
