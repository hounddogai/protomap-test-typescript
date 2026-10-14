import { GlobalFlightClaim } from "./global-flight-claim.js";

/** A rule a global flight claim must pass. Check returns its problems, or none. */
export interface GlobalFlightClaimRule {
  check(item: GlobalFlightClaim): string[];
}

export class GlobalFlightClaimRequiredCodeRule implements GlobalFlightClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFlightClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFlightClaimWindowDaysRangeRule implements GlobalFlightClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFlightClaim): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalFlightClaimContactEmailLengthRule implements GlobalFlightClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightClaim): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightClaimNameLengthRule implements GlobalFlightClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightClaimCodeLengthRule implements GlobalFlightClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global flight claim. */
export class GlobalFlightClaimValidator {
  rules: GlobalFlightClaimRule[];

  constructor(rules: GlobalFlightClaimRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFlightClaim): string[] {
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

  requireValid(item: GlobalFlightClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFlightClaim[]): Map<string, string[]> {
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

export function defaultGlobalFlightClaimValidator(): GlobalFlightClaimValidator {
  return new GlobalFlightClaimValidator(
    [
      new GlobalFlightClaimRequiredCodeRule("global flight claim needs a value"),
      new GlobalFlightClaimWindowDaysRangeRule(32, 80),
      new GlobalFlightClaimContactEmailLengthRule(80),
      new GlobalFlightClaimNameLengthRule(16),
      new GlobalFlightClaimCodeLengthRule(1000),
    ],
  );
}
