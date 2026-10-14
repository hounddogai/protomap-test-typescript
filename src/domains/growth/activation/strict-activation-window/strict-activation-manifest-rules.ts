import { StrictActivationManifest } from "./strict-activation-manifest.js";

/** A rule a strict activation manifest must pass. Check returns its problems, or none. */
export interface StrictActivationManifestRule {
  check(item: StrictActivationManifest): string[];
}

export class StrictActivationManifestLabelLengthRule implements StrictActivationManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictActivationManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictActivationManifestAmountRangeRule implements StrictActivationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictActivationManifest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictActivationManifestAttemptsRangeRule implements StrictActivationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictActivationManifest): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictActivationManifestVisibleGuardRule implements StrictActivationManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictActivationManifest): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class StrictActivationManifestCodeLengthRule implements StrictActivationManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictActivationManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictActivationManifestRequiredLabelRule implements StrictActivationManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictActivationManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict activation manifest. */
export class StrictActivationManifestValidator {
  rules: StrictActivationManifestRule[];

  constructor(rules: StrictActivationManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictActivationManifest): string[] {
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

  requireValid(item: StrictActivationManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictActivationManifest[]): Map<string, string[]> {
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

export function defaultStrictActivationManifestValidator(): StrictActivationManifestValidator {
  return new StrictActivationManifestValidator(
    [
      new StrictActivationManifestLabelLengthRule(64),
      new StrictActivationManifestAmountRangeRule(3.2, 3111.4),
      new StrictActivationManifestAttemptsRangeRule(32, 120),
      new StrictActivationManifestVisibleGuardRule(32),
      new StrictActivationManifestCodeLengthRule(255),
      new StrictActivationManifestRequiredLabelRule("strict activation manifest needs this field"),
    ],
  );
}
