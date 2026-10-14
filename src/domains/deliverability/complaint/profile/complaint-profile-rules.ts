import { ComplaintProfile } from "./complaint-profile.js";

/** A rule a complaint profile must pass. Check returns its problems, or none. */
export interface ComplaintProfileRule {
  check(item: ComplaintProfile): string[];
}

export class ComplaintProfileJourneyIdLengthRule implements ComplaintProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintProfile): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintProfilePinnedGuardRule implements ComplaintProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ComplaintProfile): string[] {
    if (item.pinned && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class ComplaintProfileCodePrefixRule implements ComplaintProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintProfileOpenRateRangeRule implements ComplaintProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintProfile): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintProfileRequiredTitleRule implements ComplaintProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintProfileRequiredJourneyIdRule implements ComplaintProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintProfile): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint profile. */
export class ComplaintProfileValidator {
  rules: ComplaintProfileRule[];

  constructor(rules: ComplaintProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintProfile[]): Map<string, string[]> {
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

export function defaultComplaintProfileValidator(): ComplaintProfileValidator {
  return new ComplaintProfileValidator(
    [
      new ComplaintProfileJourneyIdLengthRule(80),
      new ComplaintProfilePinnedGuardRule(8.1),
      new ComplaintProfileCodePrefixRule("REF"),
      new ComplaintProfileOpenRateRangeRule(1.3, 4249),
      new ComplaintProfileRequiredTitleRule("complaint profile needs an entry"),
      new ComplaintProfileRequiredJourneyIdRule("complaint profile needs this field"),
    ],
  );
}
