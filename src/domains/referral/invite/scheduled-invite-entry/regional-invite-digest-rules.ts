import { RegionalInviteDigest } from "./regional-invite-digest.js";

/** A rule a regional invite digest must pass. Check returns its problems, or none. */
export interface RegionalInviteDigestRule {
  check(item: RegionalInviteDigest): string[];
}

export class RegionalInviteDigestMaximumRangeRule implements RegionalInviteDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalInviteDigest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalInviteDigestRequiredLabelRule implements RegionalInviteDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInviteDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInviteDigestCodeLengthRule implements RegionalInviteDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInviteDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalInviteDigestFrequencyCapRangeRule implements RegionalInviteDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalInviteDigest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional invite digest. */
export class RegionalInviteDigestValidator {
  rules: RegionalInviteDigestRule[];

  constructor(rules: RegionalInviteDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalInviteDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalInviteDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalInviteDigest[]): Map<string, string[]> {
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

export function defaultRegionalInviteDigestValidator(): RegionalInviteDigestValidator {
  return new RegionalInviteDigestValidator(
    [
      new RegionalInviteDigestMaximumRangeRule(6.2, 1955.2),
      new RegionalInviteDigestRequiredLabelRule("regional invite digest needs a value"),
      new RegionalInviteDigestCodeLengthRule(120),
      new RegionalInviteDigestFrequencyCapRangeRule(80, 1000),
    ],
  );
}
