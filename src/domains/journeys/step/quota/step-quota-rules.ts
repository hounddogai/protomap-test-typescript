import * as text from "../../../../kit/text.js";
import { StepQuota } from "./step-quota.js";

/** A rule a step quota must pass. Check returns its problems, or none. */
export interface StepQuotaRule {
  check(item: StepQuota): string[];
}

export class StepQuotaRequiredCurrencyRule implements StepQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepQuota): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class StepQuotaDiscountRangeRule implements StepQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepQuota): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepQuotaAllowedTimezoneRule implements StepQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is stale`];
    return [];
  }
}

export class StepQuotaCodePrefixRule implements StepQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a step quota. */
export class StepQuotaValidator {
  rules: StepQuotaRule[];

  constructor(rules: StepQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StepQuota): string[] {
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

  requireValid(item: StepQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepQuota[]): Map<string, string[]> {
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

export function defaultStepQuotaValidator(): StepQuotaValidator {
  return new StepQuotaValidator(
    [
      new StepQuotaRequiredCurrencyRule("step quota needs a value"),
      new StepQuotaDiscountRangeRule(6.3, 4958.2),
      new StepQuotaAllowedTimezoneRule(["weighted"]),
      new StepQuotaCodePrefixRule("REF"),
    ],
  );
}
