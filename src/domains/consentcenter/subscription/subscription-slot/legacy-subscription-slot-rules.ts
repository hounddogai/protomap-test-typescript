import { LegacySubscriptionSlot } from "./legacy-subscription-slot.js";

/** A rule a legacy subscription slot must pass. Check returns its problems, or none. */
export interface LegacySubscriptionSlotRule {
  check(item: LegacySubscriptionSlot): string[];
}

export class LegacySubscriptionSlotCodeLengthRule implements LegacySubscriptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySubscriptionSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySubscriptionSlotRequiredCampaignRefRule implements LegacySubscriptionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySubscriptionSlot): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySubscriptionSlotCodePrefixRule implements LegacySubscriptionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacySubscriptionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy subscription slot. */
export class LegacySubscriptionSlotValidator {
  rules: LegacySubscriptionSlotRule[];

  constructor(rules: LegacySubscriptionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySubscriptionSlot): string[] {
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

  requireValid(item: LegacySubscriptionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySubscriptionSlot[]): Map<string, string[]> {
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

export function defaultLegacySubscriptionSlotValidator(): LegacySubscriptionSlotValidator {
  return new LegacySubscriptionSlotValidator(
    [
      new LegacySubscriptionSlotCodeLengthRule(32),
      new LegacySubscriptionSlotRequiredCampaignRefRule("legacy subscription slot needs this field"),
      new LegacySubscriptionSlotCodePrefixRule("Q"),
    ],
  );
}
