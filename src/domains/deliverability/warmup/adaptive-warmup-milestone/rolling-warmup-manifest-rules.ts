import * as text from "../../../../kit/text.js";
import { RollingWarmupManifest } from "./rolling-warmup-manifest.js";

/** A rule a rolling warmup manifest must pass. Check returns its problems, or none. */
export interface RollingWarmupManifestRule {
  check(item: RollingWarmupManifest): string[];
}

export class RollingWarmupManifestClicksRangeRule implements RollingWarmupManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWarmupManifest): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWarmupManifestEndsAtRangeRule implements RollingWarmupManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWarmupManifest): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingWarmupManifestRequiredLabelRule implements RollingWarmupManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWarmupManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWarmupManifestAllowedCodeRule implements RollingWarmupManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingWarmupManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class RollingWarmupManifestLabelLengthRule implements RollingWarmupManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWarmupManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWarmupManifestCodePrefixRule implements RollingWarmupManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingWarmupManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling warmup manifest. */
export class RollingWarmupManifestValidator {
  rules: RollingWarmupManifestRule[];

  constructor(rules: RollingWarmupManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWarmupManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingWarmupManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWarmupManifest[]): Map<string, string[]> {
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

export function defaultRollingWarmupManifestValidator(): RollingWarmupManifestValidator {
  return new RollingWarmupManifestValidator(
    [
      new RollingWarmupManifestClicksRangeRule(16, 80),
      new RollingWarmupManifestEndsAtRangeRule(16, 255),
      new RollingWarmupManifestRequiredLabelRule("rolling warmup manifest needs an entry"),
      new RollingWarmupManifestAllowedCodeRule(["primary"]),
      new RollingWarmupManifestLabelLengthRule(16),
      new RollingWarmupManifestCodePrefixRule("OPS"),
    ],
  );
}
