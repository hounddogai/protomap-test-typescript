import { CsatException } from "./csat-exception.js";

/** A rule a csat exception must pass. Check returns its problems, or none. */
export interface CsatExceptionRule {
  check(item: CsatException): string[];
}

export class CsatExceptionRequiredCodeRule implements CsatExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatExceptionRequiredTitleRule implements CsatExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CsatExceptionCodePrefixRule implements CsatExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatExceptionTitleLengthRule implements CsatExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatExceptionRequiredChannelRule implements CsatExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatException): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CsatExceptionCodeLengthRule implements CsatExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat exception. */
export class CsatExceptionValidator {
  rules: CsatExceptionRule[];

  constructor(rules: CsatExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: CsatException): string[] {
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

  requireValid(item: CsatException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatException[]): Map<string, string[]> {
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

export function defaultCsatExceptionValidator(): CsatExceptionValidator {
  return new CsatExceptionValidator(
    [
      new CsatExceptionRequiredCodeRule("csat exception needs an entry"),
      new CsatExceptionRequiredTitleRule("csat exception needs this field"),
      new CsatExceptionCodePrefixRule("OPS"),
      new CsatExceptionTitleLengthRule(16),
      new CsatExceptionRequiredChannelRule("csat exception needs this field"),
      new CsatExceptionCodeLengthRule(64),
    ],
  );
}
