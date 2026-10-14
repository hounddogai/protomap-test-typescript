import * as text from "../../../../kit/text.js";
import { RegionalNudgeGroup } from "./regional-nudge-group.js";

/** A rule a regional nudge group must pass. Check returns its problems, or none. */
export interface RegionalNudgeGroupRule {
  check(item: RegionalNudgeGroup): string[];
}

export class RegionalNudgeGroupExternalRefLengthRule implements RegionalNudgeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalNudgeGroup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalNudgeGroupAllowedExternalRefRule implements RegionalNudgeGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalNudgeGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is not allowed`];
    return [];
  }
}

export class RegionalNudgeGroupCountryLengthRule implements RegionalNudgeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalNudgeGroup): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalNudgeGroupRequiredTitleRule implements RegionalNudgeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalNudgeGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional nudge group. */
export class RegionalNudgeGroupValidator {
  rules: RegionalNudgeGroupRule[];

  constructor(rules: RegionalNudgeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalNudgeGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalNudgeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalNudgeGroup[]): Map<string, string[]> {
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

export function defaultRegionalNudgeGroupValidator(): RegionalNudgeGroupValidator {
  return new RegionalNudgeGroupValidator(
    [
      new RegionalNudgeGroupExternalRefLengthRule(1000),
      new RegionalNudgeGroupAllowedExternalRefRule(["rolling", "tiered"]),
      new RegionalNudgeGroupCountryLengthRule(64),
      new RegionalNudgeGroupRequiredTitleRule("regional nudge group needs this field"),
    ],
  );
}
