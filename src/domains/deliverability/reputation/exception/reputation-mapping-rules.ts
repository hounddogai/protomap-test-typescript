import * as text from "../../../../kit/text.js";
import { ReputationMapping } from "./reputation-mapping.js";

/** A rule a reputation mapping must pass. Check returns its problems, or none. */
export interface ReputationMappingRule {
  check(item: ReputationMapping): string[];
}

export class ReputationMappingContactEmailLengthRule implements ReputationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationMapping): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationMappingNameLengthRule implements ReputationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationMappingAllowedLocaleRule implements ReputationMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is out of range`];
    return [];
  }
}

/** Runs every rule of a reputation mapping. */
export class ReputationMappingValidator {
  rules: ReputationMappingRule[];

  constructor(rules: ReputationMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationMapping): string[] {
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

  requireValid(item: ReputationMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationMapping[]): Map<string, string[]> {
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

export function defaultReputationMappingValidator(): ReputationMappingValidator {
  return new ReputationMappingValidator(
    [
      new ReputationMappingContactEmailLengthRule(3600),
      new ReputationMappingNameLengthRule(64),
      new ReputationMappingAllowedLocaleRule(["fallback"]),
    ],
  );
}
