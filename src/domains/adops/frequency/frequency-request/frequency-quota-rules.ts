import * as text from "../../../../kit/text.js";
import { FrequencyQuota } from "./frequency-quota.js";

/** A rule a frequency quota must pass. Check returns its problems, or none. */
export interface FrequencyQuotaRule {
  check(item: FrequencyQuota): string[];
}

export class FrequencyQuotaRequiredCodeRule implements FrequencyQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyQuotaAllowedCodeRule implements FrequencyQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class FrequencyQuotaTitleLengthRule implements FrequencyQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyQuotaUnitLengthRule implements FrequencyQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyQuota): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency quota. */
export class FrequencyQuotaValidator {
  rules: FrequencyQuotaRule[];

  constructor(rules: FrequencyQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyQuota): string[] {
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

  requireValid(item: FrequencyQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyQuota[]): Map<string, string[]> {
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

export function defaultFrequencyQuotaValidator(): FrequencyQuotaValidator {
  return new FrequencyQuotaValidator(
    [
      new FrequencyQuotaRequiredCodeRule("frequency quota needs an entry"),
      new FrequencyQuotaAllowedCodeRule(["legacy", "rolling"]),
      new FrequencyQuotaTitleLengthRule(32),
      new FrequencyQuotaUnitLengthRule(1000),
    ],
  );
}
