import * as text from "../../../../kit/text.js";
import { RegionalMacroVariance } from "./regional-macro-variance.js";

/** A rule a regional macro variance must pass. Check returns its problems, or none. */
export interface RegionalMacroVarianceRule {
  check(item: RegionalMacroVariance): string[];
}

export class RegionalMacroVarianceAllowedCampaignRefRule implements RegionalMacroVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalMacroVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is out of range`];
    return [];
  }
}

export class RegionalMacroVarianceRequiredNameRule implements RegionalMacroVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalMacroVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalMacroVarianceCodeLengthRule implements RegionalMacroVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalMacroVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalMacroVarianceBudgetRangeRule implements RegionalMacroVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalMacroVariance): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalMacroVarianceRequiredRegionRule implements RegionalMacroVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalMacroVariance): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional macro variance. */
export class RegionalMacroVarianceValidator {
  rules: RegionalMacroVarianceRule[];

  constructor(rules: RegionalMacroVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalMacroVariance): string[] {
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

  requireValid(item: RegionalMacroVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalMacroVariance[]): Map<string, string[]> {
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

export function defaultRegionalMacroVarianceValidator(): RegionalMacroVarianceValidator {
  return new RegionalMacroVarianceValidator(
    [
      new RegionalMacroVarianceAllowedCampaignRefRule(["rolling"]),
      new RegionalMacroVarianceRequiredNameRule("regional macro variance needs this field"),
      new RegionalMacroVarianceCodeLengthRule(64),
      new RegionalMacroVarianceBudgetRangeRule(5.5, 1761.9),
      new RegionalMacroVarianceRequiredRegionRule("regional macro variance needs an entry"),
    ],
  );
}
