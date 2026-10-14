import { CsatQuota } from "./csat-quota.js";

/** A rule a csat quota must pass. Check returns its problems, or none. */
export interface CsatQuotaRule {
  check(item: CsatQuota): string[];
}

export class CsatQuotaCodePrefixRule implements CsatQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatQuotaRevisionRangeRule implements CsatQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatQuota): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatQuotaDescriptionLengthRule implements CsatQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatQuota): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat quota. */
export class CsatQuotaValidator {
  rules: CsatQuotaRule[];

  constructor(rules: CsatQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CsatQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatQuota[]): Map<string, string[]> {
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

export function defaultCsatQuotaValidator(): CsatQuotaValidator {
  return new CsatQuotaValidator(
    [
      new CsatQuotaCodePrefixRule("REF"),
      new CsatQuotaRevisionRangeRule(64, 1000),
      new CsatQuotaDescriptionLengthRule(3600),
    ],
  );
}
