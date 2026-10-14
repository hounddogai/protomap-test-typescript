import { RollingFlightBundle } from "./rolling-flight-bundle.js";

/** A rule a rolling flight bundle must pass. Check returns its problems, or none. */
export interface RollingFlightBundleRule {
  check(item: RollingFlightBundle): string[];
}

export class RollingFlightBundleSendAtRangeRule implements RollingFlightBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFlightBundle): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingFlightBundleRequiredNameRule implements RollingFlightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFlightBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFlightBundleRequiredCodeRule implements RollingFlightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFlightBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFlightBundleRetriesRangeRule implements RollingFlightBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFlightBundle): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingFlightBundleCodeLengthRule implements RollingFlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFlightBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling flight bundle. */
export class RollingFlightBundleValidator {
  rules: RollingFlightBundleRule[];

  constructor(rules: RollingFlightBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFlightBundle): string[] {
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

  requireValid(item: RollingFlightBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFlightBundle[]): Map<string, string[]> {
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

export function defaultRollingFlightBundleValidator(): RollingFlightBundleValidator {
  return new RollingFlightBundleValidator(
    [
      new RollingFlightBundleSendAtRangeRule(32, 255),
      new RollingFlightBundleRequiredNameRule("rolling flight bundle needs a value"),
      new RollingFlightBundleRequiredCodeRule("rolling flight bundle needs this field"),
      new RollingFlightBundleRetriesRangeRule(80, 3600),
      new RollingFlightBundleCodeLengthRule(32),
    ],
  );
}
