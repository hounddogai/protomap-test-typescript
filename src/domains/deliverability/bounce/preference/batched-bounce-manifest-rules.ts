import * as text from "../../../../kit/text.js";
import { BatchedBounceManifest } from "./batched-bounce-manifest.js";

/** A rule a batched bounce manifest must pass. Check returns its problems, or none. */
export interface BatchedBounceManifestRule {
  check(item: BatchedBounceManifest): string[];
}

export class BatchedBounceManifestCodePrefixRule implements BatchedBounceManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedBounceManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedBounceManifestRequiredLocaleRule implements BatchedBounceManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBounceManifest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedBounceManifestSendAtRangeRule implements BatchedBounceManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedBounceManifest): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedBounceManifestAllowedNameRule implements BatchedBounceManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedBounceManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class BatchedBounceManifestImpressionsRangeRule implements BatchedBounceManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedBounceManifest): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedBounceManifestReviewerLengthRule implements BatchedBounceManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBounceManifest): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched bounce manifest. */
export class BatchedBounceManifestValidator {
  rules: BatchedBounceManifestRule[];

  constructor(rules: BatchedBounceManifestRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBounceManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedBounceManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBounceManifest[]): Map<string, string[]> {
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

export function defaultBatchedBounceManifestValidator(): BatchedBounceManifestValidator {
  return new BatchedBounceManifestValidator(
    [
      new BatchedBounceManifestCodePrefixRule("REF"),
      new BatchedBounceManifestRequiredLocaleRule("batched bounce manifest needs this field"),
      new BatchedBounceManifestSendAtRangeRule(120, 3600),
      new BatchedBounceManifestAllowedNameRule(["regional", "global"]),
      new BatchedBounceManifestImpressionsRangeRule(32, 3600),
      new BatchedBounceManifestReviewerLengthRule(64),
    ],
  );
}
