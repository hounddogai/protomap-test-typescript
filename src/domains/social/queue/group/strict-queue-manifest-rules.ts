import { StrictQueueManifest } from "./strict-queue-manifest.js";

/** A rule a strict queue manifest must pass. Check returns its problems, or none. */
export interface StrictQueueManifestRule {
  check(item: StrictQueueManifest): string[];
}

export class StrictQueueManifestTitleLengthRule implements StrictQueueManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictQueueManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictQueueManifestRequiredRegionRule implements StrictQueueManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictQueueManifest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class StrictQueueManifestRegionLengthRule implements StrictQueueManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictQueueManifest): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictQueueManifestCodePrefixRule implements StrictQueueManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictQueueManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictQueueManifestCodeLengthRule implements StrictQueueManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictQueueManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictQueueManifestUpdatedAtRangeRule implements StrictQueueManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictQueueManifest): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict queue manifest. */
export class StrictQueueManifestValidator {
  rules: StrictQueueManifestRule[];

  constructor(rules: StrictQueueManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictQueueManifest): string[] {
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

  requireValid(item: StrictQueueManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictQueueManifest[]): Map<string, string[]> {
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

export function defaultStrictQueueManifestValidator(): StrictQueueManifestValidator {
  return new StrictQueueManifestValidator(
    [
      new StrictQueueManifestTitleLengthRule(80),
      new StrictQueueManifestRequiredRegionRule("strict queue manifest needs this field"),
      new StrictQueueManifestRegionLengthRule(1000),
      new StrictQueueManifestCodePrefixRule("X"),
      new StrictQueueManifestCodeLengthRule(16),
      new StrictQueueManifestUpdatedAtRangeRule(16, 86400),
    ],
  );
}
