import { CappedOptOutDigest } from "./capped-opt-out-digest.js";

/** A rule a capped opt out digest must pass. Check returns its problems, or none. */
export interface CappedOptOutDigestRule {
  check(item: CappedOptOutDigest): string[];
}

export class CappedOptOutDigestCodePrefixRule implements CappedOptOutDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedOptOutDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedOptOutDigestRequiredRegionRule implements CappedOptOutDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedOptOutDigest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class CappedOptOutDigestTitleLengthRule implements CappedOptOutDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedOptOutDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedOptOutDigestVisibleGuardRule implements CappedOptOutDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedOptOutDigest): string[] {
    if (item.visible && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CappedOptOutDigestRequiredPhoneRule implements CappedOptOutDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedOptOutDigest): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class CappedOptOutDigestRequiredCodeRule implements CappedOptOutDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedOptOutDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped opt out digest. */
export class CappedOptOutDigestValidator {
  rules: CappedOptOutDigestRule[];

  constructor(rules: CappedOptOutDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedOptOutDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedOptOutDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedOptOutDigest[]): Map<string, string[]> {
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

export function defaultCappedOptOutDigestValidator(): CappedOptOutDigestValidator {
  return new CappedOptOutDigestValidator(
    [
      new CappedOptOutDigestCodePrefixRule("X"),
      new CappedOptOutDigestRequiredRegionRule("capped opt out digest needs a value"),
      new CappedOptOutDigestTitleLengthRule(80),
      new CappedOptOutDigestVisibleGuardRule(9.9),
      new CappedOptOutDigestRequiredPhoneRule("capped opt out digest needs a value"),
      new CappedOptOutDigestRequiredCodeRule("capped opt out digest needs an entry"),
    ],
  );
}
