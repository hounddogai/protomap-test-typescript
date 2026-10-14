import { TierProfile } from "./tier-profile.js";

/** A rule a tier profile must pass. Check returns its problems, or none. */
export interface TierProfileRule {
  check(item: TierProfile): string[];
}

export class TierProfileRequiredNameRule implements TierProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TierProfileCodeLengthRule implements TierProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierProfileRequiredCodeRule implements TierProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierProfileNameLengthRule implements TierProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier profile. */
export class TierProfileValidator {
  rules: TierProfileRule[];

  constructor(rules: TierProfileRule[]) {
    this.rules = rules;
  }

  validate(item: TierProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierProfile[]): Map<string, string[]> {
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

export function defaultTierProfileValidator(): TierProfileValidator {
  return new TierProfileValidator(
    [
      new TierProfileRequiredNameRule("tier profile needs a value"),
      new TierProfileCodeLengthRule(255),
      new TierProfileRequiredCodeRule("tier profile needs a value"),
      new TierProfileNameLengthRule(255),
    ],
  );
}
