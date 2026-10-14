import * as text from "../../../../kit/text.js";
import { RegionalOptOutQuota } from "./regional-opt-out-quota.js";

/** A rule a regional opt out quota must pass. Check returns its problems, or none. */
export interface RegionalOptOutQuotaRule {
  check(item: RegionalOptOutQuota): string[];
}

export class RegionalOptOutQuotaStartsAtRangeRule implements RegionalOptOutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalOptOutQuota): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalOptOutQuotaRatioRangeRule implements RegionalOptOutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalOptOutQuota): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalOptOutQuotaAllowedCodeRule implements RegionalOptOutQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalOptOutQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a regional opt out quota. */
export class RegionalOptOutQuotaValidator {
  rules: RegionalOptOutQuotaRule[];

  constructor(rules: RegionalOptOutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalOptOutQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalOptOutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalOptOutQuota[]): Map<string, string[]> {
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

export function defaultRegionalOptOutQuotaValidator(): RegionalOptOutQuotaValidator {
  return new RegionalOptOutQuotaValidator(
    [
      new RegionalOptOutQuotaStartsAtRangeRule(32, 3600),
      new RegionalOptOutQuotaRatioRangeRule(6.5, 4128),
      new RegionalOptOutQuotaAllowedCodeRule(["default", "manual", "rolling"]),
    ],
  );
}
