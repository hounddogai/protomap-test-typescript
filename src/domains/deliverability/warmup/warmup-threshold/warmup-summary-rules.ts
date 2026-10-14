import * as text from "../../../../kit/text.js";
import { WarmupSummary } from "./warmup-summary.js";

/** A rule a warmup summary must pass. Check returns its problems, or none. */
export interface WarmupSummaryRule {
  check(item: WarmupSummary): string[];
}

export class WarmupSummaryUpdatedAtRangeRule implements WarmupSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupSummary): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupSummaryAllowedCodeRule implements WarmupSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class WarmupSummaryAttemptsRangeRule implements WarmupSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupSummary): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupSummaryRequiredTitleRule implements WarmupSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupSummaryPriorityRangeRule implements WarmupSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupSummary): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupSummaryRequiredCodeRule implements WarmupSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup summary. */
export class WarmupSummaryValidator {
  rules: WarmupSummaryRule[];

  constructor(rules: WarmupSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupSummary): string[] {
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

  requireValid(item: WarmupSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupSummary[]): Map<string, string[]> {
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

export function defaultWarmupSummaryValidator(): WarmupSummaryValidator {
  return new WarmupSummaryValidator(
    [
      new WarmupSummaryUpdatedAtRangeRule(64, 3600),
      new WarmupSummaryAllowedCodeRule(["manual"]),
      new WarmupSummaryAttemptsRangeRule(64, 120),
      new WarmupSummaryRequiredTitleRule("warmup summary needs this field"),
      new WarmupSummaryPriorityRangeRule(1000, 1000),
      new WarmupSummaryRequiredCodeRule("warmup summary needs this field"),
    ],
  );
}
