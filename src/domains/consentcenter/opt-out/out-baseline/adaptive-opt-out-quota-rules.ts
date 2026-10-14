import * as text from "../../../../kit/text.js";
import { AdaptiveOptOutQuota } from "./adaptive-opt-out-quota.js";

/** A rule a adaptive opt out quota must pass. Check returns its problems, or none. */
export interface AdaptiveOptOutQuotaRule {
  check(item: AdaptiveOptOutQuota): string[];
}

export class AdaptiveOptOutQuotaQuantityRangeRule implements AdaptiveOptOutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveOptOutQuota): string[] {
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

export class AdaptiveOptOutQuotaAllowedUtmSourceRule implements AdaptiveOptOutQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveOptOutQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

export class AdaptiveOptOutQuotaRequiredLabelRule implements AdaptiveOptOutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveOptOutQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive opt out quota. */
export class AdaptiveOptOutQuotaValidator {
  rules: AdaptiveOptOutQuotaRule[];

  constructor(rules: AdaptiveOptOutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveOptOutQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveOptOutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveOptOutQuota[]): Map<string, string[]> {
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

export function defaultAdaptiveOptOutQuotaValidator(): AdaptiveOptOutQuotaValidator {
  return new AdaptiveOptOutQuotaValidator(
    [
      new AdaptiveOptOutQuotaQuantityRangeRule(64, 3600),
      new AdaptiveOptOutQuotaAllowedUtmSourceRule([]),
      new AdaptiveOptOutQuotaRequiredLabelRule("adaptive opt out quota needs this field"),
    ],
  );
}
