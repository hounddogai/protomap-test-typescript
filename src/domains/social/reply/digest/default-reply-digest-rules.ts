import { DefaultReplyDigest } from "./default-reply-digest.js";

/** A rule a default reply digest must pass. Check returns its problems, or none. */
export interface DefaultReplyDigestRule {
  check(item: DefaultReplyDigest): string[];
}

export class DefaultReplyDigestRequiredLabelRule implements DefaultReplyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultReplyDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultReplyDigestSequenceRangeRule implements DefaultReplyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultReplyDigest): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultReplyDigestCodeLengthRule implements DefaultReplyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultReplyDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default reply digest. */
export class DefaultReplyDigestValidator {
  rules: DefaultReplyDigestRule[];

  constructor(rules: DefaultReplyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultReplyDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultReplyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultReplyDigest[]): Map<string, string[]> {
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

export function defaultDefaultReplyDigestValidator(): DefaultReplyDigestValidator {
  return new DefaultReplyDigestValidator(
    [
      new DefaultReplyDigestRequiredLabelRule("default reply digest needs this field"),
      new DefaultReplyDigestSequenceRangeRule(255, 1000),
      new DefaultReplyDigestCodeLengthRule(80),
    ],
  );
}
