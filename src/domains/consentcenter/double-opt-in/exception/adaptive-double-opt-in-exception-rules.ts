import { AdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

/** A rule a adaptive double opt in exception must pass. Check returns its problems, or none. */
export interface AdaptiveDoubleOptInExceptionRule {
  check(item: AdaptiveDoubleOptInException): string[];
}

export class AdaptiveDoubleOptInExceptionCodePrefixRule implements AdaptiveDoubleOptInExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveDoubleOptInException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveDoubleOptInExceptionVersionRangeRule implements AdaptiveDoubleOptInExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDoubleOptInException): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveDoubleOptInExceptionCodeLengthRule implements AdaptiveDoubleOptInExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDoubleOptInException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDoubleOptInExceptionNameLengthRule implements AdaptiveDoubleOptInExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDoubleOptInException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive double opt in exception. */
export class AdaptiveDoubleOptInExceptionValidator {
  rules: AdaptiveDoubleOptInExceptionRule[];

  constructor(rules: AdaptiveDoubleOptInExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDoubleOptInException): string[] {
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

  requireValid(item: AdaptiveDoubleOptInException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDoubleOptInException[]): Map<string, string[]> {
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

export function defaultAdaptiveDoubleOptInExceptionValidator(): AdaptiveDoubleOptInExceptionValidator {
  return new AdaptiveDoubleOptInExceptionValidator(
    [
      new AdaptiveDoubleOptInExceptionCodePrefixRule("OPS"),
      new AdaptiveDoubleOptInExceptionVersionRangeRule(64, 80),
      new AdaptiveDoubleOptInExceptionCodeLengthRule(3600),
      new AdaptiveDoubleOptInExceptionNameLengthRule(86400),
    ],
  );
}
