import { FallbackChallengeOverride } from "./fallback-challenge-override.js";

/** A rule a fallback challenge override must pass. Check returns its problems, or none. */
export interface FallbackChallengeOverrideRule {
  check(item: FallbackChallengeOverride): string[];
}

export class FallbackChallengeOverrideCodePrefixRule implements FallbackChallengeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackChallengeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackChallengeOverrideNameLengthRule implements FallbackChallengeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackChallengeOverrideRequiredCodeRule implements FallbackChallengeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackChallengeOverrideBudgetRangeRule implements FallbackChallengeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackChallengeOverride): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackChallengeOverrideCohortLengthRule implements FallbackChallengeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeOverride): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback challenge override. */
export class FallbackChallengeOverrideValidator {
  rules: FallbackChallengeOverrideRule[];

  constructor(rules: FallbackChallengeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackChallengeOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackChallengeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackChallengeOverride[]): Map<string, string[]> {
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

export function defaultFallbackChallengeOverrideValidator(): FallbackChallengeOverrideValidator {
  return new FallbackChallengeOverrideValidator(
    [
      new FallbackChallengeOverrideCodePrefixRule("OPS"),
      new FallbackChallengeOverrideNameLengthRule(32),
      new FallbackChallengeOverrideRequiredCodeRule("fallback challenge override needs a value"),
      new FallbackChallengeOverrideBudgetRangeRule(0.2, 4682.1),
      new FallbackChallengeOverrideCohortLengthRule(255),
    ],
  );
}
