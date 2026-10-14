import * as text from "../../../../kit/text.js";
import { DefaultDeflectionDigest } from "./default-deflection-digest.js";

/** A rule a default deflection digest must pass. Check returns its problems, or none. */
export interface DefaultDeflectionDigestRule {
  check(item: DefaultDeflectionDigest): string[];
}

export class DefaultDeflectionDigestScoreRangeRule implements DefaultDeflectionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultDeflectionDigest): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultDeflectionDigestRequiredCodeRule implements DefaultDeflectionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultDeflectionDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultDeflectionDigestCodeLengthRule implements DefaultDeflectionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultDeflectionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultDeflectionDigestRequiredLocaleRule implements DefaultDeflectionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultDeflectionDigest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultDeflectionDigestAllowedCodeRule implements DefaultDeflectionDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultDeflectionDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a default deflection digest. */
export class DefaultDeflectionDigestValidator {
  rules: DefaultDeflectionDigestRule[];

  constructor(rules: DefaultDeflectionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultDeflectionDigest): string[] {
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

  requireValid(item: DefaultDeflectionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultDeflectionDigest[]): Map<string, string[]> {
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

export function defaultDefaultDeflectionDigestValidator(): DefaultDeflectionDigestValidator {
  return new DefaultDeflectionDigestValidator(
    [
      new DefaultDeflectionDigestScoreRangeRule(1.4, 2685.7),
      new DefaultDeflectionDigestRequiredCodeRule("default deflection digest needs a value"),
      new DefaultDeflectionDigestCodeLengthRule(80),
      new DefaultDeflectionDigestRequiredLocaleRule("default deflection digest needs an entry"),
      new DefaultDeflectionDigestAllowedCodeRule(["regional"]),
    ],
  );
}
