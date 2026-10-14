import * as text from "../../../../kit/text.js";
import { BounceAdjustment } from "./bounce-adjustment.js";

/** A rule a bounce adjustment must pass. Check returns its problems, or none. */
export interface BounceAdjustmentRule {
  check(item: BounceAdjustment): string[];
}

export class BounceAdjustmentCodeLengthRule implements BounceAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceAdjustmentCodePrefixRule implements BounceAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BounceAdjustmentAllowedTimezoneRule implements BounceAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is unknown`];
    return [];
  }
}

/** Runs every rule of a bounce adjustment. */
export class BounceAdjustmentValidator {
  rules: BounceAdjustmentRule[];

  constructor(rules: BounceAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: BounceAdjustment): string[] {
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

  requireValid(item: BounceAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceAdjustment[]): Map<string, string[]> {
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

export function defaultBounceAdjustmentValidator(): BounceAdjustmentValidator {
  return new BounceAdjustmentValidator(
    [
      new BounceAdjustmentCodeLengthRule(1000),
      new BounceAdjustmentCodePrefixRule("OPS"),
      new BounceAdjustmentAllowedTimezoneRule(["lenient", "adaptive", "weighted"]),
    ],
  );
}
