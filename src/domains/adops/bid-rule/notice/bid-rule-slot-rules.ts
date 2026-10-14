import { BidRuleSlot } from "./bid-rule-slot.js";

/** A rule a bid rule slot must pass. Check returns its problems, or none. */
export interface BidRuleSlotRule {
  check(item: BidRuleSlot): string[];
}

export class BidRuleSlotConversionRateRangeRule implements BidRuleSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleSlot): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleSlotChannelLengthRule implements BidRuleSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleSlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleSlotLabelLengthRule implements BidRuleSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleSlotBatchSizeRangeRule implements BidRuleSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleSlot): string[] {
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

export class BidRuleSlotRequiredCodeRule implements BidRuleSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule slot. */
export class BidRuleSlotValidator {
  rules: BidRuleSlotRule[];

  constructor(rules: BidRuleSlotRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleSlot[]): Map<string, string[]> {
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

export function defaultBidRuleSlotValidator(): BidRuleSlotValidator {
  return new BidRuleSlotValidator(
    [
      new BidRuleSlotConversionRateRangeRule(5.1, 663),
      new BidRuleSlotChannelLengthRule(80),
      new BidRuleSlotLabelLengthRule(32),
      new BidRuleSlotBatchSizeRangeRule(16, 3600),
      new BidRuleSlotRequiredCodeRule("bid rule slot needs an entry"),
    ],
  );
}
