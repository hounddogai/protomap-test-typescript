import * as text from "../../../../kit/text.js";
import { StrictCreativeRollup } from "./strict-creative-rollup.js";

/** A rule a strict creative rollup must pass. Check returns its problems, or none. */
export interface StrictCreativeRollupRule {
  check(item: StrictCreativeRollup): string[];
}

export class StrictCreativeRollupCodeLengthRule implements StrictCreativeRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeRollupPinnedGuardRule implements StrictCreativeRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictCreativeRollup): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class StrictCreativeRollupAllowedCodeRule implements StrictCreativeRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictCreativeRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class StrictCreativeRollupRequiredCodeRule implements StrictCreativeRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreativeRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict creative rollup. */
export class StrictCreativeRollupValidator {
  rules: StrictCreativeRollupRule[];

  constructor(rules: StrictCreativeRollupRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreativeRollup): string[] {
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

  requireValid(item: StrictCreativeRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreativeRollup[]): Map<string, string[]> {
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

export function defaultStrictCreativeRollupValidator(): StrictCreativeRollupValidator {
  return new StrictCreativeRollupValidator(
    [
      new StrictCreativeRollupCodeLengthRule(16),
      new StrictCreativeRollupPinnedGuardRule(3600),
      new StrictCreativeRollupAllowedCodeRule(["default", "weighted", "adaptive"]),
      new StrictCreativeRollupRequiredCodeRule("strict creative rollup needs this field"),
    ],
  );
}
