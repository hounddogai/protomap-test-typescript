import { GlobalEnrollmentSlot } from "./global-enrollment-slot.js";

/** A rule a global enrollment slot must pass. Check returns its problems, or none. */
export interface GlobalEnrollmentSlotRule {
  check(item: GlobalEnrollmentSlot): string[];
}

export class GlobalEnrollmentSlotOwnerIdLengthRule implements GlobalEnrollmentSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEnrollmentSlot): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEnrollmentSlotBudgetRangeRule implements GlobalEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEnrollmentSlot): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalEnrollmentSlotExternalRefLengthRule implements GlobalEnrollmentSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEnrollmentSlot): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEnrollmentSlotRequiredTitleRule implements GlobalEnrollmentSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEnrollmentSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalEnrollmentSlotCodePrefixRule implements GlobalEnrollmentSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalEnrollmentSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalEnrollmentSlotRequiredOwnerIdRule implements GlobalEnrollmentSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEnrollmentSlot): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global enrollment slot. */
export class GlobalEnrollmentSlotValidator {
  rules: GlobalEnrollmentSlotRule[];

  constructor(rules: GlobalEnrollmentSlotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalEnrollmentSlot): string[] {
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

  requireValid(item: GlobalEnrollmentSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalEnrollmentSlot[]): Map<string, string[]> {
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

export function defaultGlobalEnrollmentSlotValidator(): GlobalEnrollmentSlotValidator {
  return new GlobalEnrollmentSlotValidator(
    [
      new GlobalEnrollmentSlotOwnerIdLengthRule(32),
      new GlobalEnrollmentSlotBudgetRangeRule(2.6, 682.6),
      new GlobalEnrollmentSlotExternalRefLengthRule(120),
      new GlobalEnrollmentSlotRequiredTitleRule("global enrollment slot needs this field"),
      new GlobalEnrollmentSlotCodePrefixRule("ACM"),
      new GlobalEnrollmentSlotRequiredOwnerIdRule("global enrollment slot needs an entry"),
    ],
  );
}
