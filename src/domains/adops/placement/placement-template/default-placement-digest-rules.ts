import { DefaultPlacementDigest } from "./default-placement-digest.js";

/** A rule a default placement digest must pass. Check returns its problems, or none. */
export interface DefaultPlacementDigestRule {
  check(item: DefaultPlacementDigest): string[];
}

export class DefaultPlacementDigestNameLengthRule implements DefaultPlacementDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPlacementDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPlacementDigestDiscountRangeRule implements DefaultPlacementDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPlacementDigest): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPlacementDigestContactEmailLengthRule implements DefaultPlacementDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPlacementDigest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default placement digest. */
export class DefaultPlacementDigestValidator {
  rules: DefaultPlacementDigestRule[];

  constructor(rules: DefaultPlacementDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPlacementDigest): string[] {
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

  requireValid(item: DefaultPlacementDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPlacementDigest[]): Map<string, string[]> {
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

export function defaultDefaultPlacementDigestValidator(): DefaultPlacementDigestValidator {
  return new DefaultPlacementDigestValidator(
    [
      new DefaultPlacementDigestNameLengthRule(255),
      new DefaultPlacementDigestDiscountRangeRule(7, 4953.2),
      new DefaultPlacementDigestContactEmailLengthRule(16),
    ],
  );
}
