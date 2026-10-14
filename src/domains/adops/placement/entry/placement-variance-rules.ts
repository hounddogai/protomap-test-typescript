import { PlacementVariance } from "./placement-variance.js";

/** A rule a placement variance must pass. Check returns its problems, or none. */
export interface PlacementVarianceRule {
  check(item: PlacementVariance): string[];
}

export class PlacementVarianceChecksumLengthRule implements PlacementVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementVariance): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementVarianceStartsAtRangeRule implements PlacementVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementVariance): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementVarianceClicksRangeRule implements PlacementVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementVariance): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementVarianceCodePrefixRule implements PlacementVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a placement variance. */
export class PlacementVarianceValidator {
  rules: PlacementVarianceRule[];

  constructor(rules: PlacementVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementVariance): string[] {
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

  requireValid(item: PlacementVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementVariance[]): Map<string, string[]> {
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

export function defaultPlacementVarianceValidator(): PlacementVarianceValidator {
  return new PlacementVarianceValidator(
    [
      new PlacementVarianceChecksumLengthRule(86400),
      new PlacementVarianceStartsAtRangeRule(32, 255),
      new PlacementVarianceClicksRangeRule(16, 80),
      new PlacementVarianceCodePrefixRule("REF"),
    ],
  );
}
