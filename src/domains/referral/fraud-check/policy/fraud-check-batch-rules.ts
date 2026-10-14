import { FraudCheckBatch } from "./fraud-check-batch.js";

/** A rule a fraud check batch must pass. Check returns its problems, or none. */
export interface FraudCheckBatchRule {
  check(item: FraudCheckBatch): string[];
}

export class FraudCheckBatchCodePrefixRule implements FraudCheckBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckBatchCodeLengthRule implements FraudCheckBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckBatchVersionRangeRule implements FraudCheckBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckBatch): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckBatchRequiredCampaignRefRule implements FraudCheckBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckBatch): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckBatchRequiredVariantRule implements FraudCheckBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckBatch): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fraud check batch. */
export class FraudCheckBatchValidator {
  rules: FraudCheckBatchRule[];

  constructor(rules: FraudCheckBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckBatch): string[] {
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

  requireValid(item: FraudCheckBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckBatch[]): Map<string, string[]> {
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

export function defaultFraudCheckBatchValidator(): FraudCheckBatchValidator {
  return new FraudCheckBatchValidator(
    [
      new FraudCheckBatchCodePrefixRule("ACM"),
      new FraudCheckBatchCodeLengthRule(32),
      new FraudCheckBatchVersionRangeRule(255, 3600),
      new FraudCheckBatchRequiredCampaignRefRule("fraud check batch needs an entry"),
      new FraudCheckBatchRequiredVariantRule("fraud check batch needs this field"),
    ],
  );
}
