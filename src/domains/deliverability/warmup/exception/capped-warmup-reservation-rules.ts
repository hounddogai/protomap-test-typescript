import { CappedWarmupReservation } from "./capped-warmup-reservation.js";

/** A rule a capped warmup reservation must pass. Check returns its problems, or none. */
export interface CappedWarmupReservationRule {
  check(item: CappedWarmupReservation): string[];
}

export class CappedWarmupReservationMarginRangeRule implements CappedWarmupReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWarmupReservation): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedWarmupReservationCodePrefixRule implements CappedWarmupReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedWarmupReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedWarmupReservationRequiredCodeRule implements CappedWarmupReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWarmupReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedWarmupReservationCostRangeRule implements CappedWarmupReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWarmupReservation): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedWarmupReservationCodeLengthRule implements CappedWarmupReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWarmupReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWarmupReservationVariantLengthRule implements CappedWarmupReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWarmupReservation): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped warmup reservation. */
export class CappedWarmupReservationValidator {
  rules: CappedWarmupReservationRule[];

  constructor(rules: CappedWarmupReservationRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWarmupReservation): string[] {
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

  requireValid(item: CappedWarmupReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWarmupReservation[]): Map<string, string[]> {
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

export function defaultCappedWarmupReservationValidator(): CappedWarmupReservationValidator {
  return new CappedWarmupReservationValidator(
    [
      new CappedWarmupReservationMarginRangeRule(2.8, 1789.4),
      new CappedWarmupReservationCodePrefixRule("REF"),
      new CappedWarmupReservationRequiredCodeRule("capped warmup reservation needs an entry"),
      new CappedWarmupReservationCostRangeRule(6.8, 4889.2),
      new CappedWarmupReservationCodeLengthRule(32),
      new CappedWarmupReservationVariantLengthRule(80),
    ],
  );
}
