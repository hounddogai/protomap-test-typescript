import { PrimaryPaywallManifest } from "./primary-paywall-manifest.js";

/** A rule a primary paywall manifest must pass. Check returns its problems, or none. */
export interface PrimaryPaywallManifestRule {
  check(item: PrimaryPaywallManifest): string[];
}

export class PrimaryPaywallManifestSegmentLengthRule implements PrimaryPaywallManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPaywallManifest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPaywallManifestCountryLengthRule implements PrimaryPaywallManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPaywallManifest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPaywallManifestRequiredSegmentRule implements PrimaryPaywallManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPaywallManifest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPaywallManifestRequiredCountryRule implements PrimaryPaywallManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPaywallManifest): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPaywallManifestClicksRangeRule implements PrimaryPaywallManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPaywallManifest): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary paywall manifest. */
export class PrimaryPaywallManifestValidator {
  rules: PrimaryPaywallManifestRule[];

  constructor(rules: PrimaryPaywallManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPaywallManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPaywallManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPaywallManifest[]): Map<string, string[]> {
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

export function defaultPrimaryPaywallManifestValidator(): PrimaryPaywallManifestValidator {
  return new PrimaryPaywallManifestValidator(
    [
      new PrimaryPaywallManifestSegmentLengthRule(32),
      new PrimaryPaywallManifestCountryLengthRule(1000),
      new PrimaryPaywallManifestRequiredSegmentRule("primary paywall manifest needs this field"),
      new PrimaryPaywallManifestRequiredCountryRule("primary paywall manifest needs this field"),
      new PrimaryPaywallManifestClicksRangeRule(1000, 3600),
    ],
  );
}
