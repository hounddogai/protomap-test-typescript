import * as text from "../../../../kit/text.js";
import { PaywallSlot } from "./paywall-slot.js";

/** A rule a paywall slot must pass. Check returns its problems, or none. */
export interface PaywallSlotRule {
  check(item: PaywallSlot): string[];
}

export class PaywallSlotAllowedChannelRule implements PaywallSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

export class PaywallSlotRequiredUnitRule implements PaywallSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallSlot): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallSlotCodePrefixRule implements PaywallSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallSlotRequiredTitleRule implements PaywallSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall slot. */
export class PaywallSlotValidator {
  rules: PaywallSlotRule[];

  constructor(rules: PaywallSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallSlot[]): Map<string, string[]> {
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

export function defaultPaywallSlotValidator(): PaywallSlotValidator {
  return new PaywallSlotValidator(
    [
      new PaywallSlotAllowedChannelRule(["regional", "weighted", "scheduled"]),
      new PaywallSlotRequiredUnitRule("paywall slot needs a value"),
      new PaywallSlotCodePrefixRule("ACM"),
      new PaywallSlotRequiredTitleRule("paywall slot needs this field"),
    ],
  );
}
