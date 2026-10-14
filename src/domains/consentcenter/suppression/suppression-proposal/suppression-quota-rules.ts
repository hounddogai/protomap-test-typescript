import { SuppressionQuota } from "./suppression-quota.js";

/** A rule a suppression quota must pass. Check returns its problems, or none. */
export interface SuppressionQuotaRule {
  check(item: SuppressionQuota): string[];
}

export class SuppressionQuotaLabelLengthRule implements SuppressionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionQuotaCodeLengthRule implements SuppressionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionQuotaRequiredCampaignRefRule implements SuppressionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionQuota): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionQuotaCostRangeRule implements SuppressionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionQuota): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionQuotaCampaignRefLengthRule implements SuppressionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionQuota): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionQuotaRequiredCodeRule implements SuppressionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression quota. */
export class SuppressionQuotaValidator {
  rules: SuppressionQuotaRule[];

  constructor(rules: SuppressionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionQuota[]): Map<string, string[]> {
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

export function defaultSuppressionQuotaValidator(): SuppressionQuotaValidator {
  return new SuppressionQuotaValidator(
    [
      new SuppressionQuotaLabelLengthRule(16),
      new SuppressionQuotaCodeLengthRule(3600),
      new SuppressionQuotaRequiredCampaignRefRule("suppression quota needs an entry"),
      new SuppressionQuotaCostRangeRule(8.2, 3867.6),
      new SuppressionQuotaCampaignRefLengthRule(80),
      new SuppressionQuotaRequiredCodeRule("suppression quota needs this field"),
    ],
  );
}
