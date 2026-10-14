import * as text from "../../../../kit/text.js";
import { WeightedWaitQuota } from "./weighted-wait-quota.js";

/** A rule a weighted wait quota must pass. Check returns its problems, or none. */
export interface WeightedWaitQuotaRule {
  check(item: WeightedWaitQuota): string[];
}

export class WeightedWaitQuotaAllowedNameRule implements WeightedWaitQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedWaitQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class WeightedWaitQuotaRequiredNameRule implements WeightedWaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWaitQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWaitQuotaCodeLengthRule implements WeightedWaitQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWaitQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted wait quota. */
export class WeightedWaitQuotaValidator {
  rules: WeightedWaitQuotaRule[];

  constructor(rules: WeightedWaitQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWaitQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWaitQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWaitQuota[]): Map<string, string[]> {
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

export function defaultWeightedWaitQuotaValidator(): WeightedWaitQuotaValidator {
  return new WeightedWaitQuotaValidator(
    [
      new WeightedWaitQuotaAllowedNameRule([]),
      new WeightedWaitQuotaRequiredNameRule("weighted wait quota needs a value"),
      new WeightedWaitQuotaCodeLengthRule(64),
    ],
  );
}
