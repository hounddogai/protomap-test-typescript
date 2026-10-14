import * as text from "../../../../kit/text.js";
import { DefaultRedemptionReservation } from "./default-redemption-reservation.js";

/** A rule a default redemption reservation must pass. Check returns its problems, or none. */
export interface DefaultRedemptionReservationRule {
  check(item: DefaultRedemptionReservation): string[];
}

export class DefaultRedemptionReservationAllowedCodeRule implements DefaultRedemptionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultRedemptionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class DefaultRedemptionReservationDiscountRangeRule implements DefaultRedemptionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRedemptionReservation): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultRedemptionReservationCodePrefixRule implements DefaultRedemptionReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultRedemptionReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultRedemptionReservationRequiredCodeRule implements DefaultRedemptionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRedemptionReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRedemptionReservationWeightRangeRule implements DefaultRedemptionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRedemptionReservation): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultRedemptionReservationRequiredLabelRule implements DefaultRedemptionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRedemptionReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default redemption reservation. */
export class DefaultRedemptionReservationValidator {
  rules: DefaultRedemptionReservationRule[];

  constructor(rules: DefaultRedemptionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRedemptionReservation): string[] {
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

  requireValid(item: DefaultRedemptionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRedemptionReservation[]): Map<string, string[]> {
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

export function defaultDefaultRedemptionReservationValidator(): DefaultRedemptionReservationValidator {
  return new DefaultRedemptionReservationValidator(
    [
      new DefaultRedemptionReservationAllowedCodeRule([]),
      new DefaultRedemptionReservationDiscountRangeRule(5.4, 887.5),
      new DefaultRedemptionReservationCodePrefixRule("OPS"),
      new DefaultRedemptionReservationRequiredCodeRule("default redemption reservation needs an entry"),
      new DefaultRedemptionReservationWeightRangeRule(3.3, 1716.8),
      new DefaultRedemptionReservationRequiredLabelRule("default redemption reservation needs an entry"),
    ],
  );
}
