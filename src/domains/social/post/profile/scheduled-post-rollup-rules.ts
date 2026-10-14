import * as text from "../../../../kit/text.js";
import { ScheduledPostRollup } from "./scheduled-post-rollup.js";

/** A rule a scheduled post rollup must pass. Check returns its problems, or none. */
export interface ScheduledPostRollupRule {
  check(item: ScheduledPostRollup): string[];
}

export class ScheduledPostRollupAllowedCodeRule implements ScheduledPostRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPostRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class ScheduledPostRollupCostRangeRule implements ScheduledPostRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPostRollup): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledPostRollupCampaignRefLengthRule implements ScheduledPostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPostRollup): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPostRollupCodePrefixRule implements ScheduledPostRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPostRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled post rollup. */
export class ScheduledPostRollupValidator {
  rules: ScheduledPostRollupRule[];

  constructor(rules: ScheduledPostRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPostRollup): string[] {
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

  requireValid(item: ScheduledPostRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPostRollup[]): Map<string, string[]> {
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

export function defaultScheduledPostRollupValidator(): ScheduledPostRollupValidator {
  return new ScheduledPostRollupValidator(
    [
      new ScheduledPostRollupAllowedCodeRule([]),
      new ScheduledPostRollupCostRangeRule(0.7, 1036),
      new ScheduledPostRollupCampaignRefLengthRule(120),
      new ScheduledPostRollupCodePrefixRule("REF"),
    ],
  );
}
