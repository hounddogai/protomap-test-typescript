import * as text from "../../../../kit/text.js";
import { EnrollmentMapping } from "./enrollment-mapping.js";

/** A rule a enrollment mapping must pass. Check returns its problems, or none. */
export interface EnrollmentMappingRule {
  check(item: EnrollmentMapping): string[];
}

export class EnrollmentMappingAllowedAudienceIdRule implements EnrollmentMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is out of range`];
    return [];
  }
}

export class EnrollmentMappingCodePrefixRule implements EnrollmentMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentMappingAudienceIdLengthRule implements EnrollmentMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentMapping): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentMappingTitleLengthRule implements EnrollmentMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment mapping. */
export class EnrollmentMappingValidator {
  rules: EnrollmentMappingRule[];

  constructor(rules: EnrollmentMappingRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentMapping[]): Map<string, string[]> {
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

export function defaultEnrollmentMappingValidator(): EnrollmentMappingValidator {
  return new EnrollmentMappingValidator(
    [
      new EnrollmentMappingAllowedAudienceIdRule(["strict", "scheduled", "legacy"]),
      new EnrollmentMappingCodePrefixRule("Q"),
      new EnrollmentMappingAudienceIdLengthRule(1000),
      new EnrollmentMappingTitleLengthRule(32),
    ],
  );
}
