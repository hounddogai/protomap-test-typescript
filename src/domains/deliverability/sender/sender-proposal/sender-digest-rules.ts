import { SenderDigest } from "./sender-digest.js";

/** A rule a sender digest must pass. Check returns its problems, or none. */
export interface SenderDigestRule {
  check(item: SenderDigest): string[];
}

export class SenderDigestSourceLengthRule implements SenderDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderDigest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderDigestRequiredTimezoneRule implements SenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderDigest): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class SenderDigestRequiredCodeRule implements SenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderDigestRequiredSourceRule implements SenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderDigest): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class SenderDigestCodePrefixRule implements SenderDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderDigestRequiredTitleRule implements SenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender digest. */
export class SenderDigestValidator {
  rules: SenderDigestRule[];

  constructor(rules: SenderDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SenderDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderDigest[]): Map<string, string[]> {
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

export function defaultSenderDigestValidator(): SenderDigestValidator {
  return new SenderDigestValidator(
    [
      new SenderDigestSourceLengthRule(16),
      new SenderDigestRequiredTimezoneRule("sender digest needs a value"),
      new SenderDigestRequiredCodeRule("sender digest needs this field"),
      new SenderDigestRequiredSourceRule("sender digest needs this field"),
      new SenderDigestCodePrefixRule("REF"),
      new SenderDigestRequiredTitleRule("sender digest needs a value"),
    ],
  );
}
