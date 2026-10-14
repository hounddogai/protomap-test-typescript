import * as text from "../../../../kit/text.js";
import { LenientWaitPolicy } from "./lenient-wait-policy.js";

/** A rule a lenient wait policy must pass. Check returns its problems, or none. */
export interface LenientWaitPolicyRule {
  check(item: LenientWaitPolicy): string[];
}

export class LenientWaitPolicyRequiredNotesRule implements LenientWaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWaitPolicy): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWaitPolicyCodeLengthRule implements LenientWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWaitPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWaitPolicyAllowedTitleRule implements LenientWaitPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWaitPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class LenientWaitPolicySegmentLengthRule implements LenientWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWaitPolicy): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWaitPolicyTitleLengthRule implements LenientWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWaitPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWaitPolicyNotesLengthRule implements LenientWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWaitPolicy): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient wait policy. */
export class LenientWaitPolicyValidator {
  rules: LenientWaitPolicyRule[];

  constructor(rules: LenientWaitPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWaitPolicy): string[] {
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

  requireValid(item: LenientWaitPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWaitPolicy[]): Map<string, string[]> {
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

export function defaultLenientWaitPolicyValidator(): LenientWaitPolicyValidator {
  return new LenientWaitPolicyValidator(
    [
      new LenientWaitPolicyRequiredNotesRule("lenient wait policy needs an entry"),
      new LenientWaitPolicyCodeLengthRule(255),
      new LenientWaitPolicyAllowedTitleRule(["pending"]),
      new LenientWaitPolicySegmentLengthRule(86400),
      new LenientWaitPolicyTitleLengthRule(255),
      new LenientWaitPolicyNotesLengthRule(64),
    ],
  );
}
