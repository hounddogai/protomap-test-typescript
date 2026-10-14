import { AdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

/** A rule a adaptive opt out profile must pass. Check returns its problems, or none. */
export interface AdaptiveOptOutProfileRule {
  check(item: AdaptiveOptOutProfile): string[];
}

export class AdaptiveOptOutProfileNameLengthRule implements AdaptiveOptOutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveOptOutProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveOptOutProfileRequiredLocaleRule implements AdaptiveOptOutProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveOptOutProfile): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveOptOutProfileCodePrefixRule implements AdaptiveOptOutProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveOptOutProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive opt out profile. */
export class AdaptiveOptOutProfileValidator {
  rules: AdaptiveOptOutProfileRule[];

  constructor(rules: AdaptiveOptOutProfileRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveOptOutProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveOptOutProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveOptOutProfile[]): Map<string, string[]> {
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

export function defaultAdaptiveOptOutProfileValidator(): AdaptiveOptOutProfileValidator {
  return new AdaptiveOptOutProfileValidator(
    [
      new AdaptiveOptOutProfileNameLengthRule(16),
      new AdaptiveOptOutProfileRequiredLocaleRule("adaptive opt out profile needs this field"),
      new AdaptiveOptOutProfileCodePrefixRule("X"),
    ],
  );
}
