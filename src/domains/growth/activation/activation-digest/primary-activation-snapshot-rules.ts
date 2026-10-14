import { PrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

/** A rule a primary activation snapshot must pass. Check returns its problems, or none. */
export interface PrimaryActivationSnapshotRule {
  check(item: PrimaryActivationSnapshot): string[];
}

export class PrimaryActivationSnapshotLabelLengthRule implements PrimaryActivationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryActivationSnapshotLocaleLengthRule implements PrimaryActivationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationSnapshot): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryActivationSnapshotVersionRangeRule implements PrimaryActivationSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryActivationSnapshot): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryActivationSnapshotRequiredCodeRule implements PrimaryActivationSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryActivationSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryActivationSnapshotCodeLengthRule implements PrimaryActivationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryActivationSnapshotCampaignRefLengthRule implements PrimaryActivationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationSnapshot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary activation snapshot. */
export class PrimaryActivationSnapshotValidator {
  rules: PrimaryActivationSnapshotRule[];

  constructor(rules: PrimaryActivationSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryActivationSnapshot): string[] {
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

  requireValid(item: PrimaryActivationSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryActivationSnapshot[]): Map<string, string[]> {
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

export function defaultPrimaryActivationSnapshotValidator(): PrimaryActivationSnapshotValidator {
  return new PrimaryActivationSnapshotValidator(
    [
      new PrimaryActivationSnapshotLabelLengthRule(32),
      new PrimaryActivationSnapshotLocaleLengthRule(255),
      new PrimaryActivationSnapshotVersionRangeRule(16, 3600),
      new PrimaryActivationSnapshotRequiredCodeRule("primary activation snapshot needs an entry"),
      new PrimaryActivationSnapshotCodeLengthRule(3600),
      new PrimaryActivationSnapshotCampaignRefLengthRule(255),
    ],
  );
}
