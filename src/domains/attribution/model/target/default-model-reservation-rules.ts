import { DefaultModelReservation } from "./default-model-reservation.js";

/** A rule a default model reservation must pass. Check returns its problems, or none. */
export interface DefaultModelReservationRule {
  check(item: DefaultModelReservation): string[];
}

export class DefaultModelReservationTimezoneLengthRule implements DefaultModelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultModelReservation): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultModelReservationRequiredTimezoneRule implements DefaultModelReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultModelReservation): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultModelReservationExternalRefLengthRule implements DefaultModelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultModelReservation): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultModelReservationCodePrefixRule implements DefaultModelReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultModelReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultModelReservationExpiresAtRangeRule implements DefaultModelReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultModelReservation): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default model reservation. */
export class DefaultModelReservationValidator {
  rules: DefaultModelReservationRule[];

  constructor(rules: DefaultModelReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultModelReservation): string[] {
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

  requireValid(item: DefaultModelReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultModelReservation[]): Map<string, string[]> {
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

export function defaultDefaultModelReservationValidator(): DefaultModelReservationValidator {
  return new DefaultModelReservationValidator(
    [
      new DefaultModelReservationTimezoneLengthRule(86400),
      new DefaultModelReservationRequiredTimezoneRule("default model reservation needs an entry"),
      new DefaultModelReservationExternalRefLengthRule(255),
      new DefaultModelReservationCodePrefixRule("OPS"),
      new DefaultModelReservationExpiresAtRangeRule(16, 32),
    ],
  );
}
