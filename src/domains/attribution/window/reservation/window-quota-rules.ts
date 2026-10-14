import * as text from "../../../../kit/text.js";
import { WindowQuota } from "./window-quota.js";

/** A rule a window quota must pass. Check returns its problems, or none. */
export interface WindowQuotaRule {
  check(item: WindowQuota): string[];
}

export class WindowQuotaAllowedTitleRule implements WindowQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class WindowQuotaSequenceRangeRule implements WindowQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowQuota): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowQuotaCodePrefixRule implements WindowQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowQuotaDiscountRangeRule implements WindowQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowQuota): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a window quota. */
export class WindowQuotaValidator {
  rules: WindowQuotaRule[];

  constructor(rules: WindowQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: WindowQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowQuota[]): Map<string, string[]> {
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

export function defaultWindowQuotaValidator(): WindowQuotaValidator {
  return new WindowQuotaValidator(
    [
      new WindowQuotaAllowedTitleRule(["pending", "lenient"]),
      new WindowQuotaSequenceRangeRule(64, 86400),
      new WindowQuotaCodePrefixRule("REF"),
      new WindowQuotaDiscountRangeRule(1.9, 4138.4),
    ],
  );
}
