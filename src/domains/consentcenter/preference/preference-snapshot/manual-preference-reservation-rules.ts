import { ManualPreferenceReservation } from "./manual-preference-reservation.js";

/** A rule a manual preference reservation must pass. Check returns its problems, or none. */
export interface ManualPreferenceReservationRule {
  check(item: ManualPreferenceReservation): string[];
}

export class ManualPreferenceReservationCampaignRefLengthRule implements ManualPreferenceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPreferenceReservation): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPreferenceReservationCodePrefixRule implements ManualPreferenceReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPreferenceReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualPreferenceReservationMinimumRangeRule implements ManualPreferenceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPreferenceReservation): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual preference reservation. */
export class ManualPreferenceReservationValidator {
  rules: ManualPreferenceReservationRule[];

  constructor(rules: ManualPreferenceReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPreferenceReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPreferenceReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPreferenceReservation[]): Map<string, string[]> {
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

export function defaultManualPreferenceReservationValidator(): ManualPreferenceReservationValidator {
  return new ManualPreferenceReservationValidator(
    [
      new ManualPreferenceReservationCampaignRefLengthRule(64),
      new ManualPreferenceReservationCodePrefixRule("OPS"),
      new ManualPreferenceReservationMinimumRangeRule(0.6, 1618.3),
    ],
  );
}
