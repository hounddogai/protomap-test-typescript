import { CappedBadgeSlot } from "./capped-badge-slot.js";

/** A rule a capped badge slot must pass. Check returns its problems, or none. */
export interface CappedBadgeSlotRule {
  check(item: CappedBadgeSlot): string[];
}

export class CappedBadgeSlotNameLengthRule implements CappedBadgeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBadgeSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBadgeSlotRequiredUtmSourceRule implements CappedBadgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBadgeSlot): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBadgeSlotCodePrefixRule implements CappedBadgeSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedBadgeSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedBadgeSlotEndsAtRangeRule implements CappedBadgeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBadgeSlot): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped badge slot. */
export class CappedBadgeSlotValidator {
  rules: CappedBadgeSlotRule[];

  constructor(rules: CappedBadgeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBadgeSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedBadgeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBadgeSlot[]): Map<string, string[]> {
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

export function defaultCappedBadgeSlotValidator(): CappedBadgeSlotValidator {
  return new CappedBadgeSlotValidator(
    [
      new CappedBadgeSlotNameLengthRule(120),
      new CappedBadgeSlotRequiredUtmSourceRule("capped badge slot needs this field"),
      new CappedBadgeSlotCodePrefixRule("ACM"),
      new CappedBadgeSlotEndsAtRangeRule(32, 86400),
    ],
  );
}
