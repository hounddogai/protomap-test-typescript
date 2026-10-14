import * as text from "../../../../kit/text.js";
import { RollingWindowSummary } from "./rolling-window-summary.js";

/** A rule a rolling window summary must pass. Check returns its problems, or none. */
export interface RollingWindowSummaryRule {
  check(item: RollingWindowSummary): string[];
}

export class RollingWindowSummaryQuantityRangeRule implements RollingWindowSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWindowSummary): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWindowSummaryRequiredCampaignRefRule implements RollingWindowSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWindowSummary): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWindowSummaryRequiredCodeRule implements RollingWindowSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWindowSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWindowSummaryRequiredRegionRule implements RollingWindowSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWindowSummary): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWindowSummaryFrequencyCapRangeRule implements RollingWindowSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWindowSummary): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingWindowSummaryAllowedContactEmailRule implements RollingWindowSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingWindowSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is missing`];
    return [];
  }
}

/** Runs every rule of a rolling window summary. */
export class RollingWindowSummaryValidator {
  rules: RollingWindowSummaryRule[];

  constructor(rules: RollingWindowSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWindowSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingWindowSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWindowSummary[]): Map<string, string[]> {
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

export function defaultRollingWindowSummaryValidator(): RollingWindowSummaryValidator {
  return new RollingWindowSummaryValidator(
    [
      new RollingWindowSummaryQuantityRangeRule(16, 120),
      new RollingWindowSummaryRequiredCampaignRefRule("rolling window summary needs a value"),
      new RollingWindowSummaryRequiredCodeRule("rolling window summary needs an entry"),
      new RollingWindowSummaryRequiredRegionRule("rolling window summary needs this field"),
      new RollingWindowSummaryFrequencyCapRangeRule(64, 3600),
      new RollingWindowSummaryAllowedContactEmailRule(["pending", "strict", "capped"]),
    ],
  );
}
