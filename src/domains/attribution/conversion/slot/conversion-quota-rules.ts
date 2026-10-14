import * as text from "../../../../kit/text.js";
import { ConversionQuota } from "./conversion-quota.js";

/** A rule a conversion quota must pass. Check returns its problems, or none. */
export interface ConversionQuotaRule {
  check(item: ConversionQuota): string[];
}

export class ConversionQuotaAllowedCohortRule implements ConversionQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is not allowed`];
    return [];
  }
}

export class ConversionQuotaRequiredCohortRule implements ConversionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionQuota): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionQuotaRequiredCodeRule implements ConversionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion quota. */
export class ConversionQuotaValidator {
  rules: ConversionQuotaRule[];

  constructor(rules: ConversionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionQuota[]): Map<string, string[]> {
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

export function defaultConversionQuotaValidator(): ConversionQuotaValidator {
  return new ConversionQuotaValidator(
    [
      new ConversionQuotaAllowedCohortRule(["adaptive"]),
      new ConversionQuotaRequiredCohortRule("conversion quota needs this field"),
      new ConversionQuotaRequiredCodeRule("conversion quota needs an entry"),
    ],
  );
}
