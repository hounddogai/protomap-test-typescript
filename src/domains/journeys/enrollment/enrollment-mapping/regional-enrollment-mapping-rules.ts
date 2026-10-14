import * as text from "../../../../kit/text.js";
import { RegionalEnrollmentMapping } from "./regional-enrollment-mapping.js";

/** A rule a regional enrollment mapping must pass. Check returns its problems, or none. */
export interface RegionalEnrollmentMappingRule {
  check(item: RegionalEnrollmentMapping): string[];
}

export class RegionalEnrollmentMappingAllowedSourceRule implements RegionalEnrollmentMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalEnrollmentMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is not allowed`];
    return [];
  }
}

export class RegionalEnrollmentMappingRequiredCampaignRefRule implements RegionalEnrollmentMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEnrollmentMapping): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalEnrollmentMappingLabelLengthRule implements RegionalEnrollmentMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEnrollmentMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional enrollment mapping. */
export class RegionalEnrollmentMappingValidator {
  rules: RegionalEnrollmentMappingRule[];

  constructor(rules: RegionalEnrollmentMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalEnrollmentMapping): string[] {
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

  requireValid(item: RegionalEnrollmentMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalEnrollmentMapping[]): Map<string, string[]> {
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

export function defaultRegionalEnrollmentMappingValidator(): RegionalEnrollmentMappingValidator {
  return new RegionalEnrollmentMappingValidator(
    [
      new RegionalEnrollmentMappingAllowedSourceRule(["scheduled", "primary"]),
      new RegionalEnrollmentMappingRequiredCampaignRefRule("regional enrollment mapping needs a value"),
      new RegionalEnrollmentMappingLabelLengthRule(80),
    ],
  );
}
