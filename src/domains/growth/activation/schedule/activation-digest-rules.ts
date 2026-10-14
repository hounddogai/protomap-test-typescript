import * as text from "../../../../kit/text.js";
import { ActivationDigest } from "./activation-digest.js";

/** A rule a activation digest must pass. Check returns its problems, or none. */
export interface ActivationDigestRule {
  check(item: ActivationDigest): string[];
}

export class ActivationDigestLimitRangeRule implements ActivationDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationDigest): string[] {
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

export class ActivationDigestAllowedCodeRule implements ActivationDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class ActivationDigestRequiredTitleRule implements ActivationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationDigestRequiredCodeRule implements ActivationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation digest. */
export class ActivationDigestValidator {
  rules: ActivationDigestRule[];

  constructor(rules: ActivationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationDigest): string[] {
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

  requireValid(item: ActivationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationDigest[]): Map<string, string[]> {
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

export function defaultActivationDigestValidator(): ActivationDigestValidator {
  return new ActivationDigestValidator(
    [
      new ActivationDigestLimitRangeRule(64, 255),
      new ActivationDigestAllowedCodeRule(["global", "strict"]),
      new ActivationDigestRequiredTitleRule("activation digest needs a value"),
      new ActivationDigestRequiredCodeRule("activation digest needs a value"),
    ],
  );
}
