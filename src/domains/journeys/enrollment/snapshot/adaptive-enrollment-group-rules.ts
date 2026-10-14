import * as text from "../../../../kit/text.js";
import { AdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

/** A rule a adaptive enrollment group must pass. Check returns its problems, or none. */
export interface AdaptiveEnrollmentGroupRule {
  check(item: AdaptiveEnrollmentGroup): string[];
}

export class AdaptiveEnrollmentGroupAllowedAudienceIdRule implements AdaptiveEnrollmentGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveEnrollmentGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is blocked`];
    return [];
  }
}

export class AdaptiveEnrollmentGroupCodePrefixRule implements AdaptiveEnrollmentGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveEnrollmentGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveEnrollmentGroupAttemptsRangeRule implements AdaptiveEnrollmentGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveEnrollmentGroup): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveEnrollmentGroupAudienceIdLengthRule implements AdaptiveEnrollmentGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentGroup): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveEnrollmentGroupNameLengthRule implements AdaptiveEnrollmentGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveEnrollmentGroupRequiredNameRule implements AdaptiveEnrollmentGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveEnrollmentGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive enrollment group. */
export class AdaptiveEnrollmentGroupValidator {
  rules: AdaptiveEnrollmentGroupRule[];

  constructor(rules: AdaptiveEnrollmentGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveEnrollmentGroup): string[] {
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

  requireValid(item: AdaptiveEnrollmentGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveEnrollmentGroup[]): Map<string, string[]> {
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

export function defaultAdaptiveEnrollmentGroupValidator(): AdaptiveEnrollmentGroupValidator {
  return new AdaptiveEnrollmentGroupValidator(
    [
      new AdaptiveEnrollmentGroupAllowedAudienceIdRule(["batched"]),
      new AdaptiveEnrollmentGroupCodePrefixRule("OPS"),
      new AdaptiveEnrollmentGroupAttemptsRangeRule(32, 86400),
      new AdaptiveEnrollmentGroupAudienceIdLengthRule(86400),
      new AdaptiveEnrollmentGroupNameLengthRule(64),
      new AdaptiveEnrollmentGroupRequiredNameRule("adaptive enrollment group needs an entry"),
    ],
  );
}
