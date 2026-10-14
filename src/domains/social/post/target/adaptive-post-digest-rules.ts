import { AdaptivePostDigest } from "./adaptive-post-digest.js";

/** A rule a adaptive post digest must pass. Check returns its problems, or none. */
export interface AdaptivePostDigestRule {
  check(item: AdaptivePostDigest): string[];
}

export class AdaptivePostDigestRequiredTimezoneRule implements AdaptivePostDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePostDigest): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePostDigestCodeLengthRule implements AdaptivePostDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePostDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePostDigestRequiredNameRule implements AdaptivePostDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePostDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePostDigestMaximumRangeRule implements AdaptivePostDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePostDigest): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptivePostDigestCohortLengthRule implements AdaptivePostDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePostDigest): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePostDigestTimezoneLengthRule implements AdaptivePostDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePostDigest): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive post digest. */
export class AdaptivePostDigestValidator {
  rules: AdaptivePostDigestRule[];

  constructor(rules: AdaptivePostDigestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePostDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePostDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePostDigest[]): Map<string, string[]> {
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

export function defaultAdaptivePostDigestValidator(): AdaptivePostDigestValidator {
  return new AdaptivePostDigestValidator(
    [
      new AdaptivePostDigestRequiredTimezoneRule("adaptive post digest needs an entry"),
      new AdaptivePostDigestCodeLengthRule(120),
      new AdaptivePostDigestRequiredNameRule("adaptive post digest needs an entry"),
      new AdaptivePostDigestMaximumRangeRule(0.1, 304.7),
      new AdaptivePostDigestCohortLengthRule(64),
      new AdaptivePostDigestTimezoneLengthRule(1000),
    ],
  );
}
