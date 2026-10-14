import * as text from "../../../../kit/text.js";
import { CappedDoubleOptInSlot } from "./capped-double-opt-in-slot.js";

/** A rule a capped double opt in slot must pass. Check returns its problems, or none. */
export interface CappedDoubleOptInSlotRule {
  check(item: CappedDoubleOptInSlot): string[];
}

export class CappedDoubleOptInSlotRequiredTitleRule implements CappedDoubleOptInSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDoubleOptInSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDoubleOptInSlotTitleLengthRule implements CappedDoubleOptInSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDoubleOptInSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDoubleOptInSlotCodePrefixRule implements CappedDoubleOptInSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedDoubleOptInSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedDoubleOptInSlotRequiredCodeRule implements CappedDoubleOptInSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDoubleOptInSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDoubleOptInSlotAllowedPhoneRule implements CappedDoubleOptInSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedDoubleOptInSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is missing`];
    return [];
  }
}

/** Runs every rule of a capped double opt in slot. */
export class CappedDoubleOptInSlotValidator {
  rules: CappedDoubleOptInSlotRule[];

  constructor(rules: CappedDoubleOptInSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDoubleOptInSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedDoubleOptInSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDoubleOptInSlot[]): Map<string, string[]> {
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

export function defaultCappedDoubleOptInSlotValidator(): CappedDoubleOptInSlotValidator {
  return new CappedDoubleOptInSlotValidator(
    [
      new CappedDoubleOptInSlotRequiredTitleRule("capped double opt in slot needs a value"),
      new CappedDoubleOptInSlotTitleLengthRule(16),
      new CappedDoubleOptInSlotCodePrefixRule("Q"),
      new CappedDoubleOptInSlotRequiredCodeRule("capped double opt in slot needs this field"),
      new CappedDoubleOptInSlotAllowedPhoneRule([]),
    ],
  );
}
