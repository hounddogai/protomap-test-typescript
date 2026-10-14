import * as text from "../../../../kit/text.js";
import { TieredModelDigest } from "./tiered-model-digest.js";

/** A rule a tiered model digest must pass. Check returns its problems, or none. */
export interface TieredModelDigestRule {
  check(item: TieredModelDigest): string[];
}

export class TieredModelDigestAllowedCodeRule implements TieredModelDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredModelDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class TieredModelDigestRequiredUtmSourceRule implements TieredModelDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredModelDigest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class TieredModelDigestCodeLengthRule implements TieredModelDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredModelDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredModelDigestUtmSourceLengthRule implements TieredModelDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredModelDigest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered model digest. */
export class TieredModelDigestValidator {
  rules: TieredModelDigestRule[];

  constructor(rules: TieredModelDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredModelDigest): string[] {
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

  requireValid(item: TieredModelDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredModelDigest[]): Map<string, string[]> {
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

export function defaultTieredModelDigestValidator(): TieredModelDigestValidator {
  return new TieredModelDigestValidator(
    [
      new TieredModelDigestAllowedCodeRule(["weighted"]),
      new TieredModelDigestRequiredUtmSourceRule("tiered model digest needs a value"),
      new TieredModelDigestCodeLengthRule(3600),
      new TieredModelDigestUtmSourceLengthRule(64),
    ],
  );
}
