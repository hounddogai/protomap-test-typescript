import { LegacyFlightClaim } from "./legacy-flight-claim.js";

/** A rule a legacy flight claim must pass. Check returns its problems, or none. */
export interface LegacyFlightClaimRule {
  check(item: LegacyFlightClaim): string[];
}

export class LegacyFlightClaimRequiredTitleRule implements LegacyFlightClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFlightClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFlightClaimCreatedAtRangeRule implements LegacyFlightClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFlightClaim): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFlightClaimRequiredPhoneRule implements LegacyFlightClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFlightClaim): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy flight claim. */
export class LegacyFlightClaimValidator {
  rules: LegacyFlightClaimRule[];

  constructor(rules: LegacyFlightClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFlightClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyFlightClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFlightClaim[]): Map<string, string[]> {
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

export function defaultLegacyFlightClaimValidator(): LegacyFlightClaimValidator {
  return new LegacyFlightClaimValidator(
    [
      new LegacyFlightClaimRequiredTitleRule("legacy flight claim needs an entry"),
      new LegacyFlightClaimCreatedAtRangeRule(80, 255),
      new LegacyFlightClaimRequiredPhoneRule("legacy flight claim needs an entry"),
    ],
  );
}
