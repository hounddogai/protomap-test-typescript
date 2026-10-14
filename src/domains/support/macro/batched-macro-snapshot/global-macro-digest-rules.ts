import { GlobalMacroDigest } from "./global-macro-digest.js";

/** A rule a global macro digest must pass. Check returns its problems, or none. */
export interface GlobalMacroDigestRule {
  check(item: GlobalMacroDigest): string[];
}

export class GlobalMacroDigestNameLengthRule implements GlobalMacroDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalMacroDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalMacroDigestRequiredCohortRule implements GlobalMacroDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalMacroDigest): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalMacroDigestRequiredNameRule implements GlobalMacroDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalMacroDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalMacroDigestRequiredUnitRule implements GlobalMacroDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalMacroDigest): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global macro digest. */
export class GlobalMacroDigestValidator {
  rules: GlobalMacroDigestRule[];

  constructor(rules: GlobalMacroDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalMacroDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalMacroDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalMacroDigest[]): Map<string, string[]> {
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

export function defaultGlobalMacroDigestValidator(): GlobalMacroDigestValidator {
  return new GlobalMacroDigestValidator(
    [
      new GlobalMacroDigestNameLengthRule(255),
      new GlobalMacroDigestRequiredCohortRule("global macro digest needs an entry"),
      new GlobalMacroDigestRequiredNameRule("global macro digest needs a value"),
      new GlobalMacroDigestRequiredUnitRule("global macro digest needs this field"),
    ],
  );
}
