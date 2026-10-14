import { ComplaintBundle } from "./complaint-bundle.js";

/** A rule a complaint bundle must pass. Check returns its problems, or none. */
export interface ComplaintBundleRule {
  check(item: ComplaintBundle): string[];
}

export class ComplaintBundleConversionRateRangeRule implements ComplaintBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintBundle): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintBundleOwnerIdLengthRule implements ComplaintBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintBundle): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintBundleCodePrefixRule implements ComplaintBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintBundleNameLengthRule implements ComplaintBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintBundleRequiredOwnerIdRule implements ComplaintBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintBundle): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint bundle. */
export class ComplaintBundleValidator {
  rules: ComplaintBundleRule[];

  constructor(rules: ComplaintBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintBundle): string[] {
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

  requireValid(item: ComplaintBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintBundle[]): Map<string, string[]> {
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

export function defaultComplaintBundleValidator(): ComplaintBundleValidator {
  return new ComplaintBundleValidator(
    [
      new ComplaintBundleConversionRateRangeRule(2.5, 3134.1),
      new ComplaintBundleOwnerIdLengthRule(86400),
      new ComplaintBundleCodePrefixRule("X"),
      new ComplaintBundleNameLengthRule(64),
      new ComplaintBundleRequiredOwnerIdRule("complaint bundle needs this field"),
    ],
  );
}
