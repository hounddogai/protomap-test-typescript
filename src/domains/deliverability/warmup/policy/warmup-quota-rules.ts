import { WarmupQuota } from "./warmup-quota.js";

/** A rule a warmup quota must pass. Check returns its problems, or none. */
export interface WarmupQuotaRule {
  check(item: WarmupQuota): string[];
}

export class WarmupQuotaRequiredCodeRule implements WarmupQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupQuotaCodeLengthRule implements WarmupQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupQuotaRequiredLabelRule implements WarmupQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupQuotaLabelLengthRule implements WarmupQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup quota. */
export class WarmupQuotaValidator {
  rules: WarmupQuotaRule[];

  constructor(rules: WarmupQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupQuota): string[] {
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

  requireValid(item: WarmupQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupQuota[]): Map<string, string[]> {
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

export function defaultWarmupQuotaValidator(): WarmupQuotaValidator {
  return new WarmupQuotaValidator(
    [
      new WarmupQuotaRequiredCodeRule("warmup quota needs this field"),
      new WarmupQuotaCodeLengthRule(120),
      new WarmupQuotaRequiredLabelRule("warmup quota needs an entry"),
      new WarmupQuotaLabelLengthRule(3600),
    ],
  );
}
