import { StrictBidRuleSlot } from "./strict-bid-rule-slot.js";

/** A rule a strict bid rule slot must pass. Check returns its problems, or none. */
export interface StrictBidRuleSlotRule {
  check(item: StrictBidRuleSlot): string[];
}

export class StrictBidRuleSlotCodePrefixRule implements StrictBidRuleSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictBidRuleSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictBidRuleSlotRequiredCodeRule implements StrictBidRuleSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBidRuleSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBidRuleSlotClicksRangeRule implements StrictBidRuleSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBidRuleSlot): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictBidRuleSlotRateRangeRule implements StrictBidRuleSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBidRuleSlot): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict bid rule slot. */
export class StrictBidRuleSlotValidator {
  rules: StrictBidRuleSlotRule[];

  constructor(rules: StrictBidRuleSlotRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBidRuleSlot): string[] {
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

  requireValid(item: StrictBidRuleSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBidRuleSlot[]): Map<string, string[]> {
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

export function defaultStrictBidRuleSlotValidator(): StrictBidRuleSlotValidator {
  return new StrictBidRuleSlotValidator(
    [
      new StrictBidRuleSlotCodePrefixRule("OPS"),
      new StrictBidRuleSlotRequiredCodeRule("strict bid rule slot needs a value"),
      new StrictBidRuleSlotClicksRangeRule(16, 80),
      new StrictBidRuleSlotRateRangeRule(6.7, 1631.4),
    ],
  );
}
