import * as text from "../../../../kit/text.js";
import { TieredPostRollup } from "./tiered-post-rollup.js";

/** A rule a tiered post rollup must pass. Check returns its problems, or none. */
export interface TieredPostRollupRule {
  check(item: TieredPostRollup): string[];
}

export class TieredPostRollupExternalRefLengthRule implements TieredPostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPostRollup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPostRollupAllowedDescriptionRule implements TieredPostRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPostRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is missing`];
    return [];
  }
}

export class TieredPostRollupNameLengthRule implements TieredPostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPostRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered post rollup. */
export class TieredPostRollupValidator {
  rules: TieredPostRollupRule[];

  constructor(rules: TieredPostRollupRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPostRollup): string[] {
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

  requireValid(item: TieredPostRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPostRollup[]): Map<string, string[]> {
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

export function defaultTieredPostRollupValidator(): TieredPostRollupValidator {
  return new TieredPostRollupValidator(
    [
      new TieredPostRollupExternalRefLengthRule(120),
      new TieredPostRollupAllowedDescriptionRule(["fallback", "strict", "capped"]),
      new TieredPostRollupNameLengthRule(32),
    ],
  );
}
