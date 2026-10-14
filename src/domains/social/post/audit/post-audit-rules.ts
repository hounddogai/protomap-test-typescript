import { PostAudit } from "./post-audit.js";

/** A rule a post audit must pass. Check returns its problems, or none. */
export interface PostAuditRule {
  check(item: PostAudit): string[];
}

export class PostAuditRequiredPhoneRule implements PostAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostAudit): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PostAuditNameLengthRule implements PostAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostAuditCodePrefixRule implements PostAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostAuditPhoneLengthRule implements PostAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostAudit): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostAuditMaximumRangeRule implements PostAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostAudit): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostAuditRequiredCodeRule implements PostAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post audit. */
export class PostAuditValidator {
  rules: PostAuditRule[];

  constructor(rules: PostAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PostAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostAudit[]): Map<string, string[]> {
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

export function defaultPostAuditValidator(): PostAuditValidator {
  return new PostAuditValidator(
    [
      new PostAuditRequiredPhoneRule("post audit needs an entry"),
      new PostAuditNameLengthRule(64),
      new PostAuditCodePrefixRule("X"),
      new PostAuditPhoneLengthRule(120),
      new PostAuditMaximumRangeRule(3.6, 1829.9),
      new PostAuditRequiredCodeRule("post audit needs this field"),
    ],
  );
}
