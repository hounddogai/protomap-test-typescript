import * as text from "../../../../kit/text.js";
import { DefaultStepBundle } from "./default-step-bundle.js";

/** A rule a default step bundle must pass. Check returns its problems, or none. */
export interface DefaultStepBundleRule {
  check(item: DefaultStepBundle): string[];
}

export class DefaultStepBundleRequiredLocaleRule implements DefaultStepBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultStepBundle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultStepBundleMarginRangeRule implements DefaultStepBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultStepBundle): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultStepBundleRequiredLabelRule implements DefaultStepBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultStepBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultStepBundleAllowedLocaleRule implements DefaultStepBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultStepBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is not allowed`];
    return [];
  }
}

export class DefaultStepBundleVisibleGuardRule implements DefaultStepBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultStepBundle): string[] {
    if (item.visible && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a default step bundle. */
export class DefaultStepBundleValidator {
  rules: DefaultStepBundleRule[];

  constructor(rules: DefaultStepBundleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultStepBundle): string[] {
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

  requireValid(item: DefaultStepBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultStepBundle[]): Map<string, string[]> {
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

export function defaultDefaultStepBundleValidator(): DefaultStepBundleValidator {
  return new DefaultStepBundleValidator(
    [
      new DefaultStepBundleRequiredLocaleRule("default step bundle needs a value"),
      new DefaultStepBundleMarginRangeRule(2, 2786.8),
      new DefaultStepBundleRequiredLabelRule("default step bundle needs a value"),
      new DefaultStepBundleAllowedLocaleRule([]),
      new DefaultStepBundleVisibleGuardRule(86400),
    ],
  );
}
