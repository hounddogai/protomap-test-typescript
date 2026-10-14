import { CohortPolicy } from "./cohort-policy.js";

/** A rule a cohort policy must pass. Check returns its problems, or none. */
export interface CohortPolicyRule {
  check(item: CohortPolicy): string[];
}

export class CohortPolicyLabelLengthRule implements CohortPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortPolicyRequiredCodeRule implements CohortPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortPolicyCodePrefixRule implements CohortPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortPolicyChecksumLengthRule implements CohortPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortPolicy): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortPolicyRequiredLabelRule implements CohortPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortPolicyRequiredLocaleRule implements CohortPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortPolicy): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort policy. */
export class CohortPolicyValidator {
  rules: CohortPolicyRule[];

  constructor(rules: CohortPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: CohortPolicy): string[] {
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

  requireValid(item: CohortPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortPolicy[]): Map<string, string[]> {
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

export function defaultCohortPolicyValidator(): CohortPolicyValidator {
  return new CohortPolicyValidator(
    [
      new CohortPolicyLabelLengthRule(1000),
      new CohortPolicyRequiredCodeRule("cohort policy needs a value"),
      new CohortPolicyCodePrefixRule("OPS"),
      new CohortPolicyChecksumLengthRule(86400),
      new CohortPolicyRequiredLabelRule("cohort policy needs a value"),
      new CohortPolicyRequiredLocaleRule("cohort policy needs this field"),
    ],
  );
}
