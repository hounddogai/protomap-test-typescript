import { ConversionReservation } from "./conversion-reservation.js";

/** A rule a conversion reservation must pass. Check returns its problems, or none. */
export interface ConversionReservationRule {
  check(item: ConversionReservation): string[];
}

export class ConversionReservationRequiredJourneyIdRule implements ConversionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionReservation): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionReservationSegmentLengthRule implements ConversionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionReservation): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionReservationCodePrefixRule implements ConversionReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionReservationNameLengthRule implements ConversionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion reservation. */
export class ConversionReservationValidator {
  rules: ConversionReservationRule[];

  constructor(rules: ConversionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionReservation): string[] {
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

  requireValid(item: ConversionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionReservation[]): Map<string, string[]> {
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

export function defaultConversionReservationValidator(): ConversionReservationValidator {
  return new ConversionReservationValidator(
    [
      new ConversionReservationRequiredJourneyIdRule("conversion reservation needs a value"),
      new ConversionReservationSegmentLengthRule(3600),
      new ConversionReservationCodePrefixRule("ACM"),
      new ConversionReservationNameLengthRule(16),
    ],
  );
}
