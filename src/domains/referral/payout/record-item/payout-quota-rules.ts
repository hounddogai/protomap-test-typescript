import { PayoutQuota } from "./payout-quota.js";

/** A rule a payout quota must pass. Check returns its problems, or none. */
export interface PayoutQuotaRule {
  check(item: PayoutQuota): string[];
}

export class PayoutQuotaCodeLengthRule implements PayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutQuotaRequiredAudienceIdRule implements PayoutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutQuota): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutQuotaFloorValueRangeRule implements PayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutQuota): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutQuotaAttemptsRangeRule implements PayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutQuota): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutQuotaWeightRangeRule implements PayoutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutQuota): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutQuotaAudienceIdLengthRule implements PayoutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutQuota): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout quota. */
export class PayoutQuotaValidator {
  rules: PayoutQuotaRule[];

  constructor(rules: PayoutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutQuota[]): Map<string, string[]> {
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

export function defaultPayoutQuotaValidator(): PayoutQuotaValidator {
  return new PayoutQuotaValidator(
    [
      new PayoutQuotaCodeLengthRule(80),
      new PayoutQuotaRequiredAudienceIdRule("payout quota needs an entry"),
      new PayoutQuotaFloorValueRangeRule(9.1, 847.7),
      new PayoutQuotaAttemptsRangeRule(16, 32),
      new PayoutQuotaWeightRangeRule(4.9, 2954.6),
      new PayoutQuotaAudienceIdLengthRule(120),
    ],
  );
}
