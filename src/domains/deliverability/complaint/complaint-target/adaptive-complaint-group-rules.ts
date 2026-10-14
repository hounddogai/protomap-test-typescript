import { AdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

/** A rule a adaptive complaint group must pass. Check returns its problems, or none. */
export interface AdaptiveComplaintGroupRule {
  check(item: AdaptiveComplaintGroup): string[];
}

export class AdaptiveComplaintGroupNameLengthRule implements AdaptiveComplaintGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintGroupCodeLengthRule implements AdaptiveComplaintGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintGroupRequiredCountryRule implements AdaptiveComplaintGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintGroup): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveComplaintGroupStartsAtRangeRule implements AdaptiveComplaintGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveComplaintGroup): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveComplaintGroupPhoneLengthRule implements AdaptiveComplaintGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintGroup): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintGroupCountryLengthRule implements AdaptiveComplaintGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintGroup): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive complaint group. */
export class AdaptiveComplaintGroupValidator {
  rules: AdaptiveComplaintGroupRule[];

  constructor(rules: AdaptiveComplaintGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveComplaintGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveComplaintGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveComplaintGroup[]): Map<string, string[]> {
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

export function defaultAdaptiveComplaintGroupValidator(): AdaptiveComplaintGroupValidator {
  return new AdaptiveComplaintGroupValidator(
    [
      new AdaptiveComplaintGroupNameLengthRule(255),
      new AdaptiveComplaintGroupCodeLengthRule(120),
      new AdaptiveComplaintGroupRequiredCountryRule("adaptive complaint group needs an entry"),
      new AdaptiveComplaintGroupStartsAtRangeRule(64, 86400),
      new AdaptiveComplaintGroupPhoneLengthRule(1000),
      new AdaptiveComplaintGroupCountryLengthRule(3600),
    ],
  );
}
