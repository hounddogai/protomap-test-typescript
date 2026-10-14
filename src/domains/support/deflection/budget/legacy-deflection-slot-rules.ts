import { LegacyDeflectionSlot } from "./legacy-deflection-slot.js";

/** A rule a legacy deflection slot must pass. Check returns its problems, or none. */
export interface LegacyDeflectionSlotRule {
  check(item: LegacyDeflectionSlot): string[];
}

export class LegacyDeflectionSlotLabelLengthRule implements LegacyDeflectionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDeflectionSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDeflectionSlotCodePrefixRule implements LegacyDeflectionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyDeflectionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyDeflectionSlotDescriptionLengthRule implements LegacyDeflectionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDeflectionSlot): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy deflection slot. */
export class LegacyDeflectionSlotValidator {
  rules: LegacyDeflectionSlotRule[];

  constructor(rules: LegacyDeflectionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDeflectionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyDeflectionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDeflectionSlot[]): Map<string, string[]> {
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

export function defaultLegacyDeflectionSlotValidator(): LegacyDeflectionSlotValidator {
  return new LegacyDeflectionSlotValidator(
    [
      new LegacyDeflectionSlotLabelLengthRule(86400),
      new LegacyDeflectionSlotCodePrefixRule("OPS"),
      new LegacyDeflectionSlotDescriptionLengthRule(1000),
    ],
  );
}
