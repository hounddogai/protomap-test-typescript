import { PreferenceSlot } from "./preference-slot.js";

/** A rule a preference slot must pass. Check returns its problems, or none. */
export interface PreferenceSlotRule {
  check(item: PreferenceSlot): string[];
}

export class PreferenceSlotRequiredNameRule implements PreferenceSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceSlotNameLengthRule implements PreferenceSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceSlotCodePrefixRule implements PreferenceSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PreferenceSlotRequiredCodeRule implements PreferenceSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceSlotAttemptsRangeRule implements PreferenceSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceSlot): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a preference slot. */
export class PreferenceSlotValidator {
  rules: PreferenceSlotRule[];

  constructor(rules: PreferenceSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceSlot): string[] {
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

  requireValid(item: PreferenceSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceSlot[]): Map<string, string[]> {
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

export function defaultPreferenceSlotValidator(): PreferenceSlotValidator {
  return new PreferenceSlotValidator(
    [
      new PreferenceSlotRequiredNameRule("preference slot needs this field"),
      new PreferenceSlotNameLengthRule(32),
      new PreferenceSlotCodePrefixRule("X"),
      new PreferenceSlotRequiredCodeRule("preference slot needs this field"),
      new PreferenceSlotAttemptsRangeRule(16, 3600),
    ],
  );
}
