import * as text from "../../../../kit/text.js";
import { StrictReputationSummary } from "./strict-reputation-summary.js";

/** A rule a strict reputation summary must pass. Check returns its problems, or none. */
export interface StrictReputationSummaryRule {
  check(item: StrictReputationSummary): string[];
}

export class StrictReputationSummaryQuantityRangeRule implements StrictReputationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReputationSummary): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictReputationSummaryRequiredCodeRule implements StrictReputationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReputationSummaryAllowedCodeRule implements StrictReputationSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictReputationSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class StrictReputationSummaryCodePrefixRule implements StrictReputationSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictReputationSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictReputationSummaryRequiredCampaignRefRule implements StrictReputationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationSummary): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReputationSummaryRatioRangeRule implements StrictReputationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReputationSummary): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict reputation summary. */
export class StrictReputationSummaryValidator {
  rules: StrictReputationSummaryRule[];

  constructor(rules: StrictReputationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReputationSummary): string[] {
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

  requireValid(item: StrictReputationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReputationSummary[]): Map<string, string[]> {
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

export function defaultStrictReputationSummaryValidator(): StrictReputationSummaryValidator {
  return new StrictReputationSummaryValidator(
    [
      new StrictReputationSummaryQuantityRangeRule(32, 3600),
      new StrictReputationSummaryRequiredCodeRule("strict reputation summary needs a value"),
      new StrictReputationSummaryAllowedCodeRule(["manual", "seasonal", "global"]),
      new StrictReputationSummaryCodePrefixRule("X"),
      new StrictReputationSummaryRequiredCampaignRefRule("strict reputation summary needs a value"),
      new StrictReputationSummaryRatioRangeRule(9.7, 2870.4),
    ],
  );
}
