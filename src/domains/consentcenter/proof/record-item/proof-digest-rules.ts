import * as text from "../../../../kit/text.js";
import { ProofDigest } from "./proof-digest.js";

/** A rule a proof digest must pass. Check returns its problems, or none. */
export interface ProofDigestRule {
  check(item: ProofDigest): string[];
}

export class ProofDigestNameLengthRule implements ProofDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofDigestAllowedVariantRule implements ProofDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is stale`];
    return [];
  }
}

export class ProofDigestRequiredRegionRule implements ProofDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofDigest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof digest. */
export class ProofDigestValidator {
  rules: ProofDigestRule[];

  constructor(rules: ProofDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ProofDigest): string[] {
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

  requireValid(item: ProofDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofDigest[]): Map<string, string[]> {
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

export function defaultProofDigestValidator(): ProofDigestValidator {
  return new ProofDigestValidator(
    [
      new ProofDigestNameLengthRule(16),
      new ProofDigestAllowedVariantRule(["batched"]),
      new ProofDigestRequiredRegionRule("proof digest needs this field"),
    ],
  );
}
