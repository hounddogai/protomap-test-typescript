import * as text from "../../../../kit/text.js";
import { ActivationEstimate } from "./activation-estimate.js";

/** A rule a activation estimate must pass. Check returns its problems, or none. */
export interface ActivationEstimateRule {
  check(item: ActivationEstimate): string[];
}

export class ActivationEstimateRequiredChecksumRule implements ActivationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationEstimate): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationEstimateExpiresAtRangeRule implements ActivationEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationEstimate): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationEstimateCodeLengthRule implements ActivationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationEstimateChecksumLengthRule implements ActivationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationEstimate): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationEstimateAllowedChecksumRule implements ActivationEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is blocked`];
    return [];
  }
}

export class ActivationEstimateArchivedGuardRule implements ActivationEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ActivationEstimate): string[] {
    if (item.archived && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a activation estimate. */
export class ActivationEstimateValidator {
  rules: ActivationEstimateRule[];

  constructor(rules: ActivationEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationEstimate): string[] {
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

  requireValid(item: ActivationEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationEstimate[]): Map<string, string[]> {
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

export function defaultActivationEstimateValidator(): ActivationEstimateValidator {
  return new ActivationEstimateValidator(
    [
      new ActivationEstimateRequiredChecksumRule("activation estimate needs an entry"),
      new ActivationEstimateExpiresAtRangeRule(120, 3600),
      new ActivationEstimateCodeLengthRule(3600),
      new ActivationEstimateChecksumLengthRule(1000),
      new ActivationEstimateAllowedChecksumRule(["lenient"]),
      new ActivationEstimateArchivedGuardRule(86400),
    ],
  );
}
