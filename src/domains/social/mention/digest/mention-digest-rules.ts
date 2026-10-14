import { MentionDigest } from "./mention-digest.js";

/** A rule a mention digest must pass. Check returns its problems, or none. */
export interface MentionDigestRule {
  check(item: MentionDigest): string[];
}

export class MentionDigestRequiredTimezoneRule implements MentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionDigest): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class MentionDigestCodePrefixRule implements MentionDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionDigestRequiredSegmentRule implements MentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionDigest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class MentionDigestCodeLengthRule implements MentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention digest. */
export class MentionDigestValidator {
  rules: MentionDigestRule[];

  constructor(rules: MentionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: MentionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionDigest[]): Map<string, string[]> {
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

export function defaultMentionDigestValidator(): MentionDigestValidator {
  return new MentionDigestValidator(
    [
      new MentionDigestRequiredTimezoneRule("mention digest needs an entry"),
      new MentionDigestCodePrefixRule("REF"),
      new MentionDigestRequiredSegmentRule("mention digest needs this field"),
      new MentionDigestCodeLengthRule(120),
    ],
  );
}
