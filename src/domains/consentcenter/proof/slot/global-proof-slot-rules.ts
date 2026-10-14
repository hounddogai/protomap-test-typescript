import * as text from "../../../../kit/text.js";
import { GlobalProofSlot } from "./global-proof-slot.js";

/** A rule a global proof slot must pass. Check returns its problems, or none. */
export interface GlobalProofSlotRule {
  check(item: GlobalProofSlot): string[];
}

export class GlobalProofSlotLabelLengthRule implements GlobalProofSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalProofSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalProofSlotMinimumRangeRule implements GlobalProofSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalProofSlot): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalProofSlotRequiredCountryRule implements GlobalProofSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalProofSlot): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalProofSlotCodeLengthRule implements GlobalProofSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalProofSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalProofSlotAllowedCountryRule implements GlobalProofSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalProofSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is not allowed`];
    return [];
  }
}

/** Runs every rule of a global proof slot. */
export class GlobalProofSlotValidator {
  rules: GlobalProofSlotRule[];

  constructor(rules: GlobalProofSlotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalProofSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalProofSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalProofSlot[]): Map<string, string[]> {
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

export function defaultGlobalProofSlotValidator(): GlobalProofSlotValidator {
  return new GlobalProofSlotValidator(
    [
      new GlobalProofSlotLabelLengthRule(120),
      new GlobalProofSlotMinimumRangeRule(8.4, 3625.8),
      new GlobalProofSlotRequiredCountryRule("global proof slot needs an entry"),
      new GlobalProofSlotCodeLengthRule(16),
      new GlobalProofSlotAllowedCountryRule(["weighted"]),
    ],
  );
}
