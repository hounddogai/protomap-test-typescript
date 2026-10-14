import { PrimaryCreativeBundle } from "./primary-creative-bundle.js";

/** A rule a primary creative bundle must pass. Check returns its problems, or none. */
export interface PrimaryCreativeBundleRule {
  check(item: PrimaryCreativeBundle): string[];
}

export class PrimaryCreativeBundleCodePrefixRule implements PrimaryCreativeBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryCreativeBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryCreativeBundleRequiredCategoryRule implements PrimaryCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCreativeBundle): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCreativeBundleVariantLengthRule implements PrimaryCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreativeBundle): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCreativeBundleRequiredVariantRule implements PrimaryCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCreativeBundle): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCreativeBundleWeightRangeRule implements PrimaryCreativeBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCreativeBundle): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary creative bundle. */
export class PrimaryCreativeBundleValidator {
  rules: PrimaryCreativeBundleRule[];

  constructor(rules: PrimaryCreativeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCreativeBundle): string[] {
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

  requireValid(item: PrimaryCreativeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCreativeBundle[]): Map<string, string[]> {
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

export function defaultPrimaryCreativeBundleValidator(): PrimaryCreativeBundleValidator {
  return new PrimaryCreativeBundleValidator(
    [
      new PrimaryCreativeBundleCodePrefixRule("X"),
      new PrimaryCreativeBundleRequiredCategoryRule("primary creative bundle needs a value"),
      new PrimaryCreativeBundleVariantLengthRule(3600),
      new PrimaryCreativeBundleRequiredVariantRule("primary creative bundle needs this field"),
      new PrimaryCreativeBundleWeightRangeRule(4.2, 3406.3),
    ],
  );
}
