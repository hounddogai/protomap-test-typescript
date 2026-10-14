import { RegionalInsightReservation } from "./regional-insight-reservation.js";

/** A rule a regional insight reservation must pass. Check returns its problems, or none. */
export interface RegionalInsightReservationRule {
  check(item: RegionalInsightReservation): string[];
}

export class RegionalInsightReservationNameLengthRule implements RegionalInsightReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInsightReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalInsightReservationSegmentLengthRule implements RegionalInsightReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInsightReservation): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalInsightReservationRequiredCodeRule implements RegionalInsightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInsightReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInsightReservationRequiredSegmentRule implements RegionalInsightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInsightReservation): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInsightReservationRequiredNameRule implements RegionalInsightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInsightReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInsightReservationCodePrefixRule implements RegionalInsightReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalInsightReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional insight reservation. */
export class RegionalInsightReservationValidator {
  rules: RegionalInsightReservationRule[];

  constructor(rules: RegionalInsightReservationRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalInsightReservation): string[] {
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

  requireValid(item: RegionalInsightReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalInsightReservation[]): Map<string, string[]> {
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

export function defaultRegionalInsightReservationValidator(): RegionalInsightReservationValidator {
  return new RegionalInsightReservationValidator(
    [
      new RegionalInsightReservationNameLengthRule(86400),
      new RegionalInsightReservationSegmentLengthRule(255),
      new RegionalInsightReservationRequiredCodeRule("regional insight reservation needs an entry"),
      new RegionalInsightReservationRequiredSegmentRule("regional insight reservation needs this field"),
      new RegionalInsightReservationRequiredNameRule("regional insight reservation needs a value"),
      new RegionalInsightReservationCodePrefixRule("X"),
    ],
  );
}
