import { PendingPostDigest } from "./pending-post-digest.js";

/** A rule a pending post digest must pass. Check returns its problems, or none. */
export interface PendingPostDigestRule {
  check(item: PendingPostDigest): string[];
}

export class PendingPostDigestSegmentLengthRule implements PendingPostDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPostDigest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPostDigestCodeLengthRule implements PendingPostDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPostDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPostDigestRequiredSegmentRule implements PendingPostDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPostDigest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPostDigestSourceLengthRule implements PendingPostDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPostDigest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending post digest. */
export class PendingPostDigestValidator {
  rules: PendingPostDigestRule[];

  constructor(rules: PendingPostDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPostDigest): string[] {
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

  requireValid(item: PendingPostDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPostDigest[]): Map<string, string[]> {
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

export function defaultPendingPostDigestValidator(): PendingPostDigestValidator {
  return new PendingPostDigestValidator(
    [
      new PendingPostDigestSegmentLengthRule(86400),
      new PendingPostDigestCodeLengthRule(64),
      new PendingPostDigestRequiredSegmentRule("pending post digest needs a value"),
      new PendingPostDigestSourceLengthRule(86400),
    ],
  );
}
