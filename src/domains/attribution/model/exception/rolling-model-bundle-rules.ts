import { RollingModelBundle } from "./rolling-model-bundle.js";

/** A rule a rolling model bundle must pass. Check returns its problems, or none. */
export interface RollingModelBundleRule {
  check(item: RollingModelBundle): string[];
}

export class RollingModelBundleCodePrefixRule implements RollingModelBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingModelBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingModelBundleRequiredSourceRule implements RollingModelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingModelBundle): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class RollingModelBundleCapacityRangeRule implements RollingModelBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingModelBundle): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingModelBundleRequiredCodeRule implements RollingModelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingModelBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingModelBundleCodeLengthRule implements RollingModelBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingModelBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling model bundle. */
export class RollingModelBundleValidator {
  rules: RollingModelBundleRule[];

  constructor(rules: RollingModelBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingModelBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingModelBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingModelBundle[]): Map<string, string[]> {
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

export function defaultRollingModelBundleValidator(): RollingModelBundleValidator {
  return new RollingModelBundleValidator(
    [
      new RollingModelBundleCodePrefixRule("Q"),
      new RollingModelBundleRequiredSourceRule("rolling model bundle needs an entry"),
      new RollingModelBundleCapacityRangeRule(64, 86400),
      new RollingModelBundleRequiredCodeRule("rolling model bundle needs an entry"),
      new RollingModelBundleCodeLengthRule(255),
    ],
  );
}
