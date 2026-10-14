import { PlacementDigest } from "./placement-digest.js";

/** A rule a placement digest must pass. Check returns its problems, or none. */
export interface PlacementDigestRule {
  check(item: PlacementDigest): string[];
}

export class PlacementDigestCodePrefixRule implements PlacementDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementDigestUnitLengthRule implements PlacementDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementDigest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementDigestConversionRateRangeRule implements PlacementDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementDigest): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementDigestRequiredExternalRefRule implements PlacementDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementDigest): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementDigestCodeLengthRule implements PlacementDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementDigestRequiredUnitRule implements PlacementDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementDigest): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement digest. */
export class PlacementDigestValidator {
  rules: PlacementDigestRule[];

  constructor(rules: PlacementDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementDigest): string[] {
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

  requireValid(item: PlacementDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementDigest[]): Map<string, string[]> {
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

export function defaultPlacementDigestValidator(): PlacementDigestValidator {
  return new PlacementDigestValidator(
    [
      new PlacementDigestCodePrefixRule("OPS"),
      new PlacementDigestUnitLengthRule(16),
      new PlacementDigestConversionRateRangeRule(9.6, 1910.2),
      new PlacementDigestRequiredExternalRefRule("placement digest needs a value"),
      new PlacementDigestCodeLengthRule(3600),
      new PlacementDigestRequiredUnitRule("placement digest needs a value"),
    ],
  );
}
