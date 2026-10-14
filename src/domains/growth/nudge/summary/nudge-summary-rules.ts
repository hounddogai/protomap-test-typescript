import * as text from "../../../../kit/text.js";
import { NudgeSummary } from "./nudge-summary.js";

/** A rule a nudge summary must pass. Check returns its problems, or none. */
export interface NudgeSummaryRule {
  check(item: NudgeSummary): string[];
}

export class NudgeSummaryRequiredCampaignRefRule implements NudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeSummary): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeSummaryCampaignRefLengthRule implements NudgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeSummary): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeSummaryOwnerIdLengthRule implements NudgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeSummary): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeSummaryRequiredCodeRule implements NudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeSummaryVersionRangeRule implements NudgeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeSummary): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeSummaryAllowedCodeRule implements NudgeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a nudge summary. */
export class NudgeSummaryValidator {
  rules: NudgeSummaryRule[];

  constructor(rules: NudgeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeSummary): string[] {
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

  requireValid(item: NudgeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeSummary[]): Map<string, string[]> {
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

export function defaultNudgeSummaryValidator(): NudgeSummaryValidator {
  return new NudgeSummaryValidator(
    [
      new NudgeSummaryRequiredCampaignRefRule("nudge summary needs an entry"),
      new NudgeSummaryCampaignRefLengthRule(255),
      new NudgeSummaryOwnerIdLengthRule(64),
      new NudgeSummaryRequiredCodeRule("nudge summary needs an entry"),
      new NudgeSummaryVersionRangeRule(3600, 3600),
      new NudgeSummaryAllowedCodeRule([]),
    ],
  );
}
