import * as text from "../../../../kit/text.js";
import { GlobalFlightBundle } from "./global-flight-bundle.js";

/** A rule a global flight bundle must pass. Check returns its problems, or none. */
export interface GlobalFlightBundleRule {
  check(item: GlobalFlightBundle): string[];
}

export class GlobalFlightBundleSendAtRangeRule implements GlobalFlightBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFlightBundle): string[] {
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

export class GlobalFlightBundleAllowedCategoryRule implements GlobalFlightBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalFlightBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is above maximum`];
    return [];
  }
}

export class GlobalFlightBundleRequiredCodeRule implements GlobalFlightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFlightBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFlightBundleCategoryLengthRule implements GlobalFlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightBundle): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightBundleCodeLengthRule implements GlobalFlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightBundleApprovedGuardRule implements GlobalFlightBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalFlightBundle): string[] {
    if (item.approved && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a global flight bundle. */
export class GlobalFlightBundleValidator {
  rules: GlobalFlightBundleRule[];

  constructor(rules: GlobalFlightBundleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFlightBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFlightBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFlightBundle[]): Map<string, string[]> {
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

export function defaultGlobalFlightBundleValidator(): GlobalFlightBundleValidator {
  return new GlobalFlightBundleValidator(
    [
      new GlobalFlightBundleSendAtRangeRule(16, 64),
      new GlobalFlightBundleAllowedCategoryRule(["tiered"]),
      new GlobalFlightBundleRequiredCodeRule("global flight bundle needs a value"),
      new GlobalFlightBundleCategoryLengthRule(64),
      new GlobalFlightBundleCodeLengthRule(255),
      new GlobalFlightBundleApprovedGuardRule(120),
    ],
  );
}
