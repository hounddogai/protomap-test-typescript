import { SlaQuota } from "./sla-quota.js";

/** A rule a sla quota must pass. Check returns its problems, or none. */
export interface SlaQuotaRule {
  check(item: SlaQuota): string[];
}

export class SlaQuotaRequiredCountryRule implements SlaQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaQuota): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class SlaQuotaCodePrefixRule implements SlaQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaQuotaBudgetRangeRule implements SlaQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaQuota): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a sla quota. */
export class SlaQuotaValidator {
  rules: SlaQuotaRule[];

  constructor(rules: SlaQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SlaQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaQuota[]): Map<string, string[]> {
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

export function defaultSlaQuotaValidator(): SlaQuotaValidator {
  return new SlaQuotaValidator(
    [
      new SlaQuotaRequiredCountryRule("sla quota needs this field"),
      new SlaQuotaCodePrefixRule("OPS"),
      new SlaQuotaBudgetRangeRule(2.5, 1330),
    ],
  );
}
