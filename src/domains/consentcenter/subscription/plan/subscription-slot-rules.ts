import { SubscriptionSlot } from "./subscription-slot.js";

/** A rule a subscription slot must pass. Check returns its problems, or none. */
export interface SubscriptionSlotRule {
  check(item: SubscriptionSlot): string[];
}

export class SubscriptionSlotRequiredCodeRule implements SubscriptionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionSlotLabelLengthRule implements SubscriptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionSlotActiveGuardRule implements SubscriptionSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SubscriptionSlot): string[] {
    if (item.active && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a subscription slot. */
export class SubscriptionSlotValidator {
  rules: SubscriptionSlotRule[];

  constructor(rules: SubscriptionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionSlot[]): Map<string, string[]> {
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

export function defaultSubscriptionSlotValidator(): SubscriptionSlotValidator {
  return new SubscriptionSlotValidator(
    [
      new SubscriptionSlotRequiredCodeRule("subscription slot needs this field"),
      new SubscriptionSlotLabelLengthRule(3600),
      new SubscriptionSlotActiveGuardRule(255),
    ],
  );
}
