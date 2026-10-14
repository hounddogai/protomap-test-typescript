import { PendingWindowManifest } from "./pending-window-manifest.js";

/** A rule a pending window manifest must pass. Check returns its problems, or none. */
export interface PendingWindowManifestRule {
  check(item: PendingWindowManifest): string[];
}

export class PendingWindowManifestJourneyIdLengthRule implements PendingWindowManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingWindowManifest): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingWindowManifestRequiredTitleRule implements PendingWindowManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingWindowManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingWindowManifestRequiredOwnerIdRule implements PendingWindowManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingWindowManifest): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingWindowManifestTitleLengthRule implements PendingWindowManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingWindowManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingWindowManifestVersionRangeRule implements PendingWindowManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingWindowManifest): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingWindowManifestCodePrefixRule implements PendingWindowManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingWindowManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending window manifest. */
export class PendingWindowManifestValidator {
  rules: PendingWindowManifestRule[];

  constructor(rules: PendingWindowManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingWindowManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingWindowManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingWindowManifest[]): Map<string, string[]> {
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

export function defaultPendingWindowManifestValidator(): PendingWindowManifestValidator {
  return new PendingWindowManifestValidator(
    [
      new PendingWindowManifestJourneyIdLengthRule(3600),
      new PendingWindowManifestRequiredTitleRule("pending window manifest needs an entry"),
      new PendingWindowManifestRequiredOwnerIdRule("pending window manifest needs this field"),
      new PendingWindowManifestTitleLengthRule(16),
      new PendingWindowManifestVersionRangeRule(64, 80),
      new PendingWindowManifestCodePrefixRule("ACM"),
    ],
  );
}
