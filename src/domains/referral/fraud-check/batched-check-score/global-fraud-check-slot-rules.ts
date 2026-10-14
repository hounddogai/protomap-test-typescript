import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckSlot } from "./global-fraud-check-slot.js";

/** A rule a global fraud check slot must pass. Check returns its problems, or none. */
export interface GlobalFraudCheckSlotRule {
  check(item: GlobalFraudCheckSlot): string[];
}

export class GlobalFraudCheckSlotMaximumRangeRule implements GlobalFraudCheckSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFraudCheckSlot): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalFraudCheckSlotAllowedTitleRule implements GlobalFraudCheckSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalFraudCheckSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class GlobalFraudCheckSlotRequiredCampaignRefRule implements GlobalFraudCheckSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFraudCheckSlot): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFraudCheckSlotCodePrefixRule implements GlobalFraudCheckSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalFraudCheckSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalFraudCheckSlotRequiredTitleRule implements GlobalFraudCheckSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFraudCheckSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global fraud check slot. */
export class GlobalFraudCheckSlotValidator {
  rules: GlobalFraudCheckSlotRule[];

  constructor(rules: GlobalFraudCheckSlotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFraudCheckSlot): string[] {
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

  requireValid(item: GlobalFraudCheckSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFraudCheckSlot[]): Map<string, string[]> {
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

export function defaultGlobalFraudCheckSlotValidator(): GlobalFraudCheckSlotValidator {
  return new GlobalFraudCheckSlotValidator(
    [
      new GlobalFraudCheckSlotMaximumRangeRule(6.7, 509.3),
      new GlobalFraudCheckSlotAllowedTitleRule(["weighted"]),
      new GlobalFraudCheckSlotRequiredCampaignRefRule("global fraud check slot needs an entry"),
      new GlobalFraudCheckSlotCodePrefixRule("OPS"),
      new GlobalFraudCheckSlotRequiredTitleRule("global fraud check slot needs a value"),
    ],
  );
}
