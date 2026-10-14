import { RegionalMentionDigest } from "./regional-mention-digest.js";

/** A rule a regional mention digest must pass. Check returns its problems, or none. */
export interface RegionalMentionDigestRule {
  check(item: RegionalMentionDigest): string[];
}

export class RegionalMentionDigestLabelLengthRule implements RegionalMentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalMentionDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalMentionDigestCodePrefixRule implements RegionalMentionDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalMentionDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalMentionDigestGraceDaysRangeRule implements RegionalMentionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalMentionDigest): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalMentionDigestRequiredTitleRule implements RegionalMentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalMentionDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalMentionDigestNameLengthRule implements RegionalMentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalMentionDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional mention digest. */
export class RegionalMentionDigestValidator {
  rules: RegionalMentionDigestRule[];

  constructor(rules: RegionalMentionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalMentionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalMentionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalMentionDigest[]): Map<string, string[]> {
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

export function defaultRegionalMentionDigestValidator(): RegionalMentionDigestValidator {
  return new RegionalMentionDigestValidator(
    [
      new RegionalMentionDigestLabelLengthRule(80),
      new RegionalMentionDigestCodePrefixRule("REF"),
      new RegionalMentionDigestGraceDaysRangeRule(255, 3600),
      new RegionalMentionDigestRequiredTitleRule("regional mention digest needs a value"),
      new RegionalMentionDigestNameLengthRule(1000),
    ],
  );
}
