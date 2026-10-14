import * as text from "../../../../kit/text.js";
import { LenientDeflectionManifest } from "./lenient-deflection-manifest.js";

/** A rule a lenient deflection manifest must pass. Check returns its problems, or none. */
export interface LenientDeflectionManifestRule {
  check(item: LenientDeflectionManifest): string[];
}

export class LenientDeflectionManifestAllowedVariantRule implements LenientDeflectionManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientDeflectionManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is too long`];
    return [];
  }
}

export class LenientDeflectionManifestCodeLengthRule implements LenientDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientDeflectionManifestNameLengthRule implements LenientDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient deflection manifest. */
export class LenientDeflectionManifestValidator {
  rules: LenientDeflectionManifestRule[];

  constructor(rules: LenientDeflectionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDeflectionManifest): string[] {
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

  requireValid(item: LenientDeflectionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDeflectionManifest[]): Map<string, string[]> {
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

export function defaultLenientDeflectionManifestValidator(): LenientDeflectionManifestValidator {
  return new LenientDeflectionManifestValidator(
    [
      new LenientDeflectionManifestAllowedVariantRule(["default", "primary", "batched"]),
      new LenientDeflectionManifestCodeLengthRule(16),
      new LenientDeflectionManifestNameLengthRule(32),
    ],
  );
}
