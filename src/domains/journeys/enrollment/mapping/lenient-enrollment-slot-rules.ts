import { LenientEnrollmentSlot } from "./lenient-enrollment-slot.js";

/** A rule a lenient enrollment slot must pass. Check returns its problems, or none. */
export interface LenientEnrollmentSlotRule {
  check(item: LenientEnrollmentSlot): string[];
}

export class LenientEnrollmentSlotRequiredNameRule implements LenientEnrollmentSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientEnrollmentSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientEnrollmentSlotCodePrefixRule implements LenientEnrollmentSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientEnrollmentSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientEnrollmentSlotNameLengthRule implements LenientEnrollmentSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientEnrollmentSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientEnrollmentSlotMarginRangeRule implements LenientEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientEnrollmentSlot): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient enrollment slot. */
export class LenientEnrollmentSlotValidator {
  rules: LenientEnrollmentSlotRule[];

  constructor(rules: LenientEnrollmentSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LenientEnrollmentSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientEnrollmentSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientEnrollmentSlot[]): Map<string, string[]> {
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

export function defaultLenientEnrollmentSlotValidator(): LenientEnrollmentSlotValidator {
  return new LenientEnrollmentSlotValidator(
    [
      new LenientEnrollmentSlotRequiredNameRule("lenient enrollment slot needs an entry"),
      new LenientEnrollmentSlotCodePrefixRule("OPS"),
      new LenientEnrollmentSlotNameLengthRule(32),
      new LenientEnrollmentSlotMarginRangeRule(2.3, 2235.8),
    ],
  );
}
