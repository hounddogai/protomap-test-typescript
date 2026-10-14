import * as text from "../../../../kit/text.js";
import { RetentionRollup } from "./retention-rollup.js";

/** A rule a retention rollup must pass. Check returns its problems, or none. */
export interface RetentionRollupRule {
  check(item: RetentionRollup): string[];
}

export class RetentionRollupConversionRateRangeRule implements RetentionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionRollup): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionRollupRequiredNameRule implements RetentionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionRollupAllowedCodeRule implements RetentionRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a retention rollup. */
export class RetentionRollupValidator {
  rules: RetentionRollupRule[];

  constructor(rules: RetentionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionRollup): string[] {
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

  requireValid(item: RetentionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionRollup[]): Map<string, string[]> {
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

export function defaultRetentionRollupValidator(): RetentionRollupValidator {
  return new RetentionRollupValidator(
    [
      new RetentionRollupConversionRateRangeRule(7.2, 4884),
      new RetentionRollupRequiredNameRule("retention rollup needs a value"),
      new RetentionRollupAllowedCodeRule(["seasonal", "primary"]),
    ],
  );
}
