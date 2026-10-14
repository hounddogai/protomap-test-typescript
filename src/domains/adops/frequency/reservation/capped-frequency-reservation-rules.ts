import { CappedFrequencyReservation } from "./capped-frequency-reservation.js";

/** A rule a capped frequency reservation must pass. Check returns its problems, or none. */
export interface CappedFrequencyReservationRule {
  check(item: CappedFrequencyReservation): string[];
}

export class CappedFrequencyReservationTitleLengthRule implements CappedFrequencyReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFrequencyReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFrequencyReservationRequiredTitleRule implements CappedFrequencyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyReservationCodePrefixRule implements CappedFrequencyReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedFrequencyReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedFrequencyReservationRequiredCodeRule implements CappedFrequencyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyReservationRequiredLabelRule implements CappedFrequencyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped frequency reservation. */
export class CappedFrequencyReservationValidator {
  rules: CappedFrequencyReservationRule[];

  constructor(rules: CappedFrequencyReservationRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFrequencyReservation): string[] {
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

  requireValid(item: CappedFrequencyReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFrequencyReservation[]): Map<string, string[]> {
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

export function defaultCappedFrequencyReservationValidator(): CappedFrequencyReservationValidator {
  return new CappedFrequencyReservationValidator(
    [
      new CappedFrequencyReservationTitleLengthRule(3600),
      new CappedFrequencyReservationRequiredTitleRule("capped frequency reservation needs an entry"),
      new CappedFrequencyReservationCodePrefixRule("X"),
      new CappedFrequencyReservationRequiredCodeRule("capped frequency reservation needs a value"),
      new CappedFrequencyReservationRequiredLabelRule("capped frequency reservation needs a value"),
    ],
  );
}
