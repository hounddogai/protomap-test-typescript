import { TierCycle } from "./tier-cycle.js";

/** A rule a tier cycle must pass. Check returns its problems, or none. */
export interface TierCycleRule {
  check(item: TierCycle): string[];
}

export class TierCycleRequiredContactEmailRule implements TierCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierCycle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class TierCycleRequiredCodeRule implements TierCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierCycleUtmSourceLengthRule implements TierCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierCycle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierCycleContactEmailLengthRule implements TierCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierCycle): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier cycle. */
export class TierCycleValidator {
  rules: TierCycleRule[];

  constructor(rules: TierCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TierCycle): string[] {
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

  requireValid(item: TierCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierCycle[]): Map<string, string[]> {
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

export function defaultTierCycleValidator(): TierCycleValidator {
  return new TierCycleValidator(
    [
      new TierCycleRequiredContactEmailRule("tier cycle needs this field"),
      new TierCycleRequiredCodeRule("tier cycle needs an entry"),
      new TierCycleUtmSourceLengthRule(255),
      new TierCycleContactEmailLengthRule(1000),
    ],
  );
}
