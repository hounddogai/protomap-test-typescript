import * as text from "../../../../kit/text.js";
import { CappedWaitDigest } from "./capped-wait-digest.js";

/** A rule a capped wait digest must pass. Check returns its problems, or none. */
export interface CappedWaitDigestRule {
  check(item: CappedWaitDigest): string[];
}

export class CappedWaitDigestCodeLengthRule implements CappedWaitDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWaitDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWaitDigestLimitRangeRule implements CappedWaitDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWaitDigest): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedWaitDigestRequiredTitleRule implements CappedWaitDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWaitDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedWaitDigestAllowedContactEmailRule implements CappedWaitDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedWaitDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is stale`];
    return [];
  }
}

export class CappedWaitDigestRequiredCodeRule implements CappedWaitDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWaitDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped wait digest. */
export class CappedWaitDigestValidator {
  rules: CappedWaitDigestRule[];

  constructor(rules: CappedWaitDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWaitDigest): string[] {
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

  requireValid(item: CappedWaitDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWaitDigest[]): Map<string, string[]> {
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

export function defaultCappedWaitDigestValidator(): CappedWaitDigestValidator {
  return new CappedWaitDigestValidator(
    [
      new CappedWaitDigestCodeLengthRule(255),
      new CappedWaitDigestLimitRangeRule(120, 255),
      new CappedWaitDigestRequiredTitleRule("capped wait digest needs this field"),
      new CappedWaitDigestAllowedContactEmailRule([]),
      new CappedWaitDigestRequiredCodeRule("capped wait digest needs a value"),
    ],
  );
}
