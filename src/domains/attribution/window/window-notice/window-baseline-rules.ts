import * as text from "../../../../kit/text.js";
import { WindowBaseline } from "./window-baseline.js";

/** A rule a window baseline must pass. Check returns its problems, or none. */
export interface WindowBaselineRule {
  check(item: WindowBaseline): string[];
}

export class WindowBaselinePriorityRangeRule implements WindowBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowBaseline): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowBaselineAllowedUtmSourceRule implements WindowBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is blocked`];
    return [];
  }
}

export class WindowBaselineCodePrefixRule implements WindowBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowBaselineRequiredUtmSourceRule implements WindowBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowBaseline): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class WindowBaselineRequiredReviewerRule implements WindowBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowBaseline): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class WindowBaselineRequiredNameRule implements WindowBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window baseline. */
export class WindowBaselineValidator {
  rules: WindowBaselineRule[];

  constructor(rules: WindowBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: WindowBaseline): string[] {
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

  requireValid(item: WindowBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowBaseline[]): Map<string, string[]> {
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

export function defaultWindowBaselineValidator(): WindowBaselineValidator {
  return new WindowBaselineValidator(
    [
      new WindowBaselinePriorityRangeRule(64, 64),
      new WindowBaselineAllowedUtmSourceRule([]),
      new WindowBaselineCodePrefixRule("Q"),
      new WindowBaselineRequiredUtmSourceRule("window baseline needs an entry"),
      new WindowBaselineRequiredReviewerRule("window baseline needs this field"),
      new WindowBaselineRequiredNameRule("window baseline needs an entry"),
    ],
  );
}
