import { CappedStreakDigest } from "./capped-streak-digest.js";

/** A rule a capped streak digest must pass. Check returns its problems, or none. */
export interface CappedStreakDigestRule {
  check(item: CappedStreakDigest): string[];
}

export class CappedStreakDigestRequiredLocaleRule implements CappedStreakDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStreakDigest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStreakDigestLocaleLengthRule implements CappedStreakDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStreakDigestRequiredCodeRule implements CappedStreakDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStreakDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStreakDigestApprovedGuardRule implements CappedStreakDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedStreakDigest): string[] {
    if (item.approved && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class CappedStreakDigestCodeLengthRule implements CappedStreakDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped streak digest. */
export class CappedStreakDigestValidator {
  rules: CappedStreakDigestRule[];

  constructor(rules: CappedStreakDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStreakDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedStreakDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStreakDigest[]): Map<string, string[]> {
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

export function defaultCappedStreakDigestValidator(): CappedStreakDigestValidator {
  return new CappedStreakDigestValidator(
    [
      new CappedStreakDigestRequiredLocaleRule("capped streak digest needs a value"),
      new CappedStreakDigestLocaleLengthRule(86400),
      new CappedStreakDigestRequiredCodeRule("capped streak digest needs this field"),
      new CappedStreakDigestApprovedGuardRule(5.8),
      new CappedStreakDigestCodeLengthRule(3600),
    ],
  );
}
