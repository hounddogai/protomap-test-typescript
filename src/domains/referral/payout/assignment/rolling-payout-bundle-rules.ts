import { RollingPayoutBundle } from "./rolling-payout-bundle.js";

/** A rule a rolling payout bundle must pass. Check returns its problems, or none. */
export interface RollingPayoutBundleRule {
  check(item: RollingPayoutBundle): string[];
}

export class RollingPayoutBundleVersionRangeRule implements RollingPayoutBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPayoutBundle): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPayoutBundleRequiredTitleRule implements RollingPayoutBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPayoutBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPayoutBundleCodePrefixRule implements RollingPayoutBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPayoutBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingPayoutBundleNameLengthRule implements RollingPayoutBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPayoutBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling payout bundle. */
export class RollingPayoutBundleValidator {
  rules: RollingPayoutBundleRule[];

  constructor(rules: RollingPayoutBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPayoutBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPayoutBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPayoutBundle[]): Map<string, string[]> {
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

export function defaultRollingPayoutBundleValidator(): RollingPayoutBundleValidator {
  return new RollingPayoutBundleValidator(
    [
      new RollingPayoutBundleVersionRangeRule(3600, 86400),
      new RollingPayoutBundleRequiredTitleRule("rolling payout bundle needs a value"),
      new RollingPayoutBundleCodePrefixRule("OPS"),
      new RollingPayoutBundleNameLengthRule(3600),
    ],
  );
}
