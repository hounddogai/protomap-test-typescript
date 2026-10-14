import { WaitManifest } from "./wait-manifest.js";

/** A rule a wait manifest must pass. Check returns its problems, or none. */
export interface WaitManifestRule {
  check(item: WaitManifest): string[];
}

export class WaitManifestRateRangeRule implements WaitManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitManifest): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitManifestRequiredNotesRule implements WaitManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitManifest): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class WaitManifestTitleLengthRule implements WaitManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitManifestRequiredCodeRule implements WaitManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitManifestRequiredRegionRule implements WaitManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitManifest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait manifest. */
export class WaitManifestValidator {
  rules: WaitManifestRule[];

  constructor(rules: WaitManifestRule[]) {
    this.rules = rules;
  }

  validate(item: WaitManifest): string[] {
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

  requireValid(item: WaitManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitManifest[]): Map<string, string[]> {
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

export function defaultWaitManifestValidator(): WaitManifestValidator {
  return new WaitManifestValidator(
    [
      new WaitManifestRateRangeRule(6.9, 2405.2),
      new WaitManifestRequiredNotesRule("wait manifest needs a value"),
      new WaitManifestTitleLengthRule(64),
      new WaitManifestRequiredCodeRule("wait manifest needs a value"),
      new WaitManifestRequiredRegionRule("wait manifest needs this field"),
    ],
  );
}
