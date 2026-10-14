import * as text from "../../../../kit/text.js";
import { DefaultPreferenceReservation } from "./default-preference-reservation.js";

/** A rule a default preference reservation must pass. Check returns its problems, or none. */
export interface DefaultPreferenceReservationRule {
  check(item: DefaultPreferenceReservation): string[];
}

export class DefaultPreferenceReservationMinimumRangeRule implements DefaultPreferenceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPreferenceReservation): string[] {
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

export class DefaultPreferenceReservationLocaleLengthRule implements DefaultPreferenceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPreferenceReservation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPreferenceReservationAllowedNameRule implements DefaultPreferenceReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPreferenceReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class DefaultPreferenceReservationCodePrefixRule implements DefaultPreferenceReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPreferenceReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPreferenceReservationSequenceRangeRule implements DefaultPreferenceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPreferenceReservation): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default preference reservation. */
export class DefaultPreferenceReservationValidator {
  rules: DefaultPreferenceReservationRule[];

  constructor(rules: DefaultPreferenceReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPreferenceReservation): string[] {
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

  requireValid(item: DefaultPreferenceReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPreferenceReservation[]): Map<string, string[]> {
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

export function defaultDefaultPreferenceReservationValidator(): DefaultPreferenceReservationValidator {
  return new DefaultPreferenceReservationValidator(
    [
      new DefaultPreferenceReservationMinimumRangeRule(7, 4402),
      new DefaultPreferenceReservationLocaleLengthRule(16),
      new DefaultPreferenceReservationAllowedNameRule(["batched"]),
      new DefaultPreferenceReservationCodePrefixRule("REF"),
      new DefaultPreferenceReservationSequenceRangeRule(64, 120),
    ],
  );
}
