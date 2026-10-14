import { CappedSenderProfile } from "./capped-sender-profile.js";

/** A rule a capped sender profile must pass. Check returns its problems, or none. */
export interface CappedSenderProfileRule {
  check(item: CappedSenderProfile): string[];
}

export class CappedSenderProfileCodeLengthRule implements CappedSenderProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSenderProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSenderProfileRequiredCodeRule implements CappedSenderProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSenderProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSenderProfileNameLengthRule implements CappedSenderProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSenderProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSenderProfileRequiredNameRule implements CappedSenderProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSenderProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSenderProfileCodePrefixRule implements CappedSenderProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedSenderProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedSenderProfileRequiredSourceRule implements CappedSenderProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSenderProfile): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped sender profile. */
export class CappedSenderProfileValidator {
  rules: CappedSenderProfileRule[];

  constructor(rules: CappedSenderProfileRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSenderProfile): string[] {
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

  requireValid(item: CappedSenderProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSenderProfile[]): Map<string, string[]> {
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

export function defaultCappedSenderProfileValidator(): CappedSenderProfileValidator {
  return new CappedSenderProfileValidator(
    [
      new CappedSenderProfileCodeLengthRule(120),
      new CappedSenderProfileRequiredCodeRule("capped sender profile needs a value"),
      new CappedSenderProfileNameLengthRule(120),
      new CappedSenderProfileRequiredNameRule("capped sender profile needs this field"),
      new CappedSenderProfileCodePrefixRule("X"),
      new CappedSenderProfileRequiredSourceRule("capped sender profile needs an entry"),
    ],
  );
}
