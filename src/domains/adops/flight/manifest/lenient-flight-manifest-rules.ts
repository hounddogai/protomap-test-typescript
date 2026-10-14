import * as text from "../../../../kit/text.js";
import { LenientFlightManifest } from "./lenient-flight-manifest.js";

/** A rule a lenient flight manifest must pass. Check returns its problems, or none. */
export interface LenientFlightManifestRule {
  check(item: LenientFlightManifest): string[];
}

export class LenientFlightManifestRetriesRangeRule implements LenientFlightManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFlightManifest): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientFlightManifestCodePrefixRule implements LenientFlightManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientFlightManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientFlightManifestRequiredCodeRule implements LenientFlightManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFlightManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFlightManifestAllowedLabelRule implements LenientFlightManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientFlightManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class LenientFlightManifestRequiredChannelRule implements LenientFlightManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFlightManifest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFlightManifestLabelLengthRule implements LenientFlightManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFlightManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient flight manifest. */
export class LenientFlightManifestValidator {
  rules: LenientFlightManifestRule[];

  constructor(rules: LenientFlightManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFlightManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFlightManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFlightManifest[]): Map<string, string[]> {
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

export function defaultLenientFlightManifestValidator(): LenientFlightManifestValidator {
  return new LenientFlightManifestValidator(
    [
      new LenientFlightManifestRetriesRangeRule(16, 32),
      new LenientFlightManifestCodePrefixRule("ACM"),
      new LenientFlightManifestRequiredCodeRule("lenient flight manifest needs this field"),
      new LenientFlightManifestAllowedLabelRule(["manual"]),
      new LenientFlightManifestRequiredChannelRule("lenient flight manifest needs this field"),
      new LenientFlightManifestLabelLengthRule(16),
    ],
  );
}
