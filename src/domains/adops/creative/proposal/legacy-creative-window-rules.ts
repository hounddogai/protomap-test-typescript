import { LegacyCreativeWindow } from "./legacy-creative-window.js";

/** A rule a legacy creative window must pass. Check returns its problems, or none. */
export interface LegacyCreativeWindowRule {
  check(item: LegacyCreativeWindow): string[];
}

export class LegacyCreativeWindowRequiredLabelRule implements LegacyCreativeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCreativeWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCreativeWindowCodeLengthRule implements LegacyCreativeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCreativeWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCreativeWindowWindowDaysRangeRule implements LegacyCreativeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCreativeWindow): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyCreativeWindowCountryLengthRule implements LegacyCreativeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCreativeWindow): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCreativeWindowCodePrefixRule implements LegacyCreativeWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyCreativeWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy creative window. */
export class LegacyCreativeWindowValidator {
  rules: LegacyCreativeWindowRule[];

  constructor(rules: LegacyCreativeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCreativeWindow): string[] {
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

  requireValid(item: LegacyCreativeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCreativeWindow[]): Map<string, string[]> {
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

export function defaultLegacyCreativeWindowValidator(): LegacyCreativeWindowValidator {
  return new LegacyCreativeWindowValidator(
    [
      new LegacyCreativeWindowRequiredLabelRule("legacy creative window needs this field"),
      new LegacyCreativeWindowCodeLengthRule(64),
      new LegacyCreativeWindowWindowDaysRangeRule(64, 120),
      new LegacyCreativeWindowCountryLengthRule(86400),
      new LegacyCreativeWindowCodePrefixRule("Q"),
    ],
  );
}
