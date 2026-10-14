import { LegacyCsatQuota } from "./legacy-csat-quota.js";

/** A rule a legacy csat quota must pass. Check returns its problems, or none. */
export interface LegacyCsatQuotaRule {
  check(item: LegacyCsatQuota): string[];
}

export class LegacyCsatQuotaRequiredCodeRule implements LegacyCsatQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCsatQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCsatQuotaCodePrefixRule implements LegacyCsatQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyCsatQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyCsatQuotaLabelLengthRule implements LegacyCsatQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCsatQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCsatQuotaRequiredLabelRule implements LegacyCsatQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCsatQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy csat quota. */
export class LegacyCsatQuotaValidator {
  rules: LegacyCsatQuotaRule[];

  constructor(rules: LegacyCsatQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCsatQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyCsatQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCsatQuota[]): Map<string, string[]> {
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

export function defaultLegacyCsatQuotaValidator(): LegacyCsatQuotaValidator {
  return new LegacyCsatQuotaValidator(
    [
      new LegacyCsatQuotaRequiredCodeRule("legacy csat quota needs a value"),
      new LegacyCsatQuotaCodePrefixRule("OPS"),
      new LegacyCsatQuotaLabelLengthRule(16),
      new LegacyCsatQuotaRequiredLabelRule("legacy csat quota needs this field"),
    ],
  );
}
