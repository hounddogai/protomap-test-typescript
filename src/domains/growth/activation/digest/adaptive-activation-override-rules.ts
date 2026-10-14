import { AdaptiveActivationOverride } from "./adaptive-activation-override.js";

/** A rule a adaptive activation override must pass. Check returns its problems, or none. */
export interface AdaptiveActivationOverrideRule {
  check(item: AdaptiveActivationOverride): string[];
}

export class AdaptiveActivationOverridePhoneLengthRule implements AdaptiveActivationOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveActivationOverride): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveActivationOverrideRateRangeRule implements AdaptiveActivationOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveActivationOverride): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveActivationOverrideEndsAtRangeRule implements AdaptiveActivationOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveActivationOverride): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveActivationOverrideActiveGuardRule implements AdaptiveActivationOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveActivationOverride): string[] {
    if (item.active && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class AdaptiveActivationOverrideRequiredPhoneRule implements AdaptiveActivationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveActivationOverride): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveActivationOverrideCodeLengthRule implements AdaptiveActivationOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveActivationOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive activation override. */
export class AdaptiveActivationOverrideValidator {
  rules: AdaptiveActivationOverrideRule[];

  constructor(rules: AdaptiveActivationOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveActivationOverride): string[] {
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

  requireValid(item: AdaptiveActivationOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveActivationOverride[]): Map<string, string[]> {
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

export function defaultAdaptiveActivationOverrideValidator(): AdaptiveActivationOverrideValidator {
  return new AdaptiveActivationOverrideValidator(
    [
      new AdaptiveActivationOverridePhoneLengthRule(3600),
      new AdaptiveActivationOverrideRateRangeRule(2.2, 4690.5),
      new AdaptiveActivationOverrideEndsAtRangeRule(32, 86400),
      new AdaptiveActivationOverrideActiveGuardRule(86400),
      new AdaptiveActivationOverrideRequiredPhoneRule("adaptive activation override needs this field"),
      new AdaptiveActivationOverrideCodeLengthRule(3600),
    ],
  );
}
