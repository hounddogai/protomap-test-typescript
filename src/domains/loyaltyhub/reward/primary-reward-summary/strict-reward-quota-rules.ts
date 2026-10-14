import * as text from "../../../../kit/text.js";
import { StrictRewardQuota } from "./strict-reward-quota.js";

/** A rule a strict reward quota must pass. Check returns its problems, or none. */
export interface StrictRewardQuotaRule {
  check(item: StrictRewardQuota): string[];
}

export class StrictRewardQuotaNameLengthRule implements StrictRewardQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardQuotaAllowedSegmentRule implements StrictRewardQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is unknown`];
    return [];
  }
}

export class StrictRewardQuotaRequiredCodeRule implements StrictRewardQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardQuotaRequiredTitleRule implements StrictRewardQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardQuotaCodePrefixRule implements StrictRewardQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictRewardQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict reward quota. */
export class StrictRewardQuotaValidator {
  rules: StrictRewardQuotaRule[];

  constructor(rules: StrictRewardQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardQuota): string[] {
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

  requireValid(item: StrictRewardQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardQuota[]): Map<string, string[]> {
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

export function defaultStrictRewardQuotaValidator(): StrictRewardQuotaValidator {
  return new StrictRewardQuotaValidator(
    [
      new StrictRewardQuotaNameLengthRule(16),
      new StrictRewardQuotaAllowedSegmentRule(["pending", "batched"]),
      new StrictRewardQuotaRequiredCodeRule("strict reward quota needs this field"),
      new StrictRewardQuotaRequiredTitleRule("strict reward quota needs a value"),
      new StrictRewardQuotaCodePrefixRule("ACM"),
    ],
  );
}
