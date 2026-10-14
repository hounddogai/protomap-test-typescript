import { PayoutTarget } from "./payout-target.js";

/** A rule a payout target must pass. Check returns its problems, or none. */
export interface PayoutTargetRule {
  check(item: PayoutTarget): string[];
}

export class PayoutTargetRequiredLabelRule implements PayoutTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutTargetBatchSizeRangeRule implements PayoutTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutTarget): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutTargetSendAtRangeRule implements PayoutTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutTarget): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutTargetRegionLengthRule implements PayoutTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutTarget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutTargetLabelLengthRule implements PayoutTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutTargetPriorityRangeRule implements PayoutTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutTarget): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a payout target. */
export class PayoutTargetValidator {
  rules: PayoutTargetRule[];

  constructor(rules: PayoutTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutTarget): string[] {
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

  requireValid(item: PayoutTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutTarget[]): Map<string, string[]> {
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

export function defaultPayoutTargetValidator(): PayoutTargetValidator {
  return new PayoutTargetValidator(
    [
      new PayoutTargetRequiredLabelRule("payout target needs an entry"),
      new PayoutTargetBatchSizeRangeRule(120, 86400),
      new PayoutTargetSendAtRangeRule(32, 64),
      new PayoutTargetRegionLengthRule(120),
      new PayoutTargetLabelLengthRule(32),
      new PayoutTargetPriorityRangeRule(32, 80),
    ],
  );
}
