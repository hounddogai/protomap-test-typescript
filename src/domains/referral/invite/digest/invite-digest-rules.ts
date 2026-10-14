import { InviteDigest } from "./invite-digest.js";

/** A rule a invite digest must pass. Check returns its problems, or none. */
export interface InviteDigestRule {
  check(item: InviteDigest): string[];
}

export class InviteDigestCodeLengthRule implements InviteDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteDigestChecksumLengthRule implements InviteDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteDigest): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteDigestCodePrefixRule implements InviteDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteDigestRequiredCodeRule implements InviteDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteDigestSummaryLengthRule implements InviteDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteDigest): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite digest. */
export class InviteDigestValidator {
  rules: InviteDigestRule[];

  constructor(rules: InviteDigestRule[]) {
    this.rules = rules;
  }

  validate(item: InviteDigest): string[] {
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

  requireValid(item: InviteDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteDigest[]): Map<string, string[]> {
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

export function defaultInviteDigestValidator(): InviteDigestValidator {
  return new InviteDigestValidator(
    [
      new InviteDigestCodeLengthRule(16),
      new InviteDigestChecksumLengthRule(3600),
      new InviteDigestCodePrefixRule("REF"),
      new InviteDigestRequiredCodeRule("invite digest needs a value"),
      new InviteDigestSummaryLengthRule(64),
    ],
  );
}
