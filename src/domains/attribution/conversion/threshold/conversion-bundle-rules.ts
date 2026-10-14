import { ConversionBundle } from "./conversion-bundle.js";

/** A rule a conversion bundle must pass. Check returns its problems, or none. */
export interface ConversionBundleRule {
  check(item: ConversionBundle): string[];
}

export class ConversionBundleThresholdRangeRule implements ConversionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionBundle): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionBundleCodePrefixRule implements ConversionBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionBundleRequiredPhoneRule implements ConversionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionBundle): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion bundle. */
export class ConversionBundleValidator {
  rules: ConversionBundleRule[];

  constructor(rules: ConversionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionBundle[]): Map<string, string[]> {
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

export function defaultConversionBundleValidator(): ConversionBundleValidator {
  return new ConversionBundleValidator(
    [
      new ConversionBundleThresholdRangeRule(1.4, 3505.7),
      new ConversionBundleCodePrefixRule("Q"),
      new ConversionBundleRequiredPhoneRule("conversion bundle needs this field"),
    ],
  );
}
