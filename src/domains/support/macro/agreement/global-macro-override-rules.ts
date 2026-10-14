import { GlobalMacroOverride } from "./global-macro-override.js";

/** A rule a global macro override must pass. Check returns its problems, or none. */
export interface GlobalMacroOverrideRule {
  check(item: GlobalMacroOverride): string[];
}

export class GlobalMacroOverrideApprovedGuardRule implements GlobalMacroOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalMacroOverride): string[] {
    if (item.approved && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class GlobalMacroOverrideRequiredCountryRule implements GlobalMacroOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalMacroOverride): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalMacroOverrideCountryLengthRule implements GlobalMacroOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalMacroOverride): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global macro override. */
export class GlobalMacroOverrideValidator {
  rules: GlobalMacroOverrideRule[];

  constructor(rules: GlobalMacroOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalMacroOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalMacroOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalMacroOverride[]): Map<string, string[]> {
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

export function defaultGlobalMacroOverrideValidator(): GlobalMacroOverrideValidator {
  return new GlobalMacroOverrideValidator(
    [
      new GlobalMacroOverrideApprovedGuardRule(6.3),
      new GlobalMacroOverrideRequiredCountryRule("global macro override needs this field"),
      new GlobalMacroOverrideCountryLengthRule(1000),
    ],
  );
}
