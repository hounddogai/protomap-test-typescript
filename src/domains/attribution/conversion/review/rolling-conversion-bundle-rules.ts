import { RollingConversionBundle } from "./rolling-conversion-bundle.js";

/** A rule a rolling conversion bundle must pass. Check returns its problems, or none. */
export interface RollingConversionBundleRule {
  check(item: RollingConversionBundle): string[];
}

export class RollingConversionBundleRequiredCodeRule implements RollingConversionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingConversionBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingConversionBundleVisibleGuardRule implements RollingConversionBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingConversionBundle): string[] {
    if (item.visible && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RollingConversionBundleNameLengthRule implements RollingConversionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling conversion bundle. */
export class RollingConversionBundleValidator {
  rules: RollingConversionBundleRule[];

  constructor(rules: RollingConversionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingConversionBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingConversionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingConversionBundle[]): Map<string, string[]> {
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

export function defaultRollingConversionBundleValidator(): RollingConversionBundleValidator {
  return new RollingConversionBundleValidator(
    [
      new RollingConversionBundleRequiredCodeRule("rolling conversion bundle needs an entry"),
      new RollingConversionBundleVisibleGuardRule(8.7),
      new RollingConversionBundleNameLengthRule(80),
    ],
  );
}
