import * as text from "../../../../kit/text.js";
import { RegionalSlaDigest } from "./regional-sla-digest.js";

/** A rule a regional sla digest must pass. Check returns its problems, or none. */
export interface RegionalSlaDigestRule {
  check(item: RegionalSlaDigest): string[];
}

export class RegionalSlaDigestRequiredCodeRule implements RegionalSlaDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSlaDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSlaDigestNameLengthRule implements RegionalSlaDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSlaDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSlaDigestOwnerIdLengthRule implements RegionalSlaDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSlaDigest): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSlaDigestCodePrefixRule implements RegionalSlaDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalSlaDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalSlaDigestAllowedCodeRule implements RegionalSlaDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSlaDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class RegionalSlaDigestCapacityRangeRule implements RegionalSlaDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSlaDigest): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional sla digest. */
export class RegionalSlaDigestValidator {
  rules: RegionalSlaDigestRule[];

  constructor(rules: RegionalSlaDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSlaDigest): string[] {
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

  requireValid(item: RegionalSlaDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSlaDigest[]): Map<string, string[]> {
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

export function defaultRegionalSlaDigestValidator(): RegionalSlaDigestValidator {
  return new RegionalSlaDigestValidator(
    [
      new RegionalSlaDigestRequiredCodeRule("regional sla digest needs this field"),
      new RegionalSlaDigestNameLengthRule(32),
      new RegionalSlaDigestOwnerIdLengthRule(3600),
      new RegionalSlaDigestCodePrefixRule("X"),
      new RegionalSlaDigestAllowedCodeRule(["weighted", "legacy"]),
      new RegionalSlaDigestCapacityRangeRule(3600, 3600),
    ],
  );
}
