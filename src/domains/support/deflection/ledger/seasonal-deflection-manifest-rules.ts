import { SeasonalDeflectionManifest } from "./seasonal-deflection-manifest.js";

/** A rule a seasonal deflection manifest must pass. Check returns its problems, or none. */
export interface SeasonalDeflectionManifestRule {
  check(item: SeasonalDeflectionManifest): string[];
}

export class SeasonalDeflectionManifestCodeLengthRule implements SeasonalDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDeflectionManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDeflectionManifestOwnerIdLengthRule implements SeasonalDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDeflectionManifest): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDeflectionManifestRequiredOwnerIdRule implements SeasonalDeflectionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDeflectionManifest): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDeflectionManifestTitleLengthRule implements SeasonalDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDeflectionManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDeflectionManifestCodePrefixRule implements SeasonalDeflectionManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalDeflectionManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalDeflectionManifestOpenRateRangeRule implements SeasonalDeflectionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDeflectionManifest): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal deflection manifest. */
export class SeasonalDeflectionManifestValidator {
  rules: SeasonalDeflectionManifestRule[];

  constructor(rules: SeasonalDeflectionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDeflectionManifest): string[] {
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

  requireValid(item: SeasonalDeflectionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDeflectionManifest[]): Map<string, string[]> {
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

export function defaultSeasonalDeflectionManifestValidator(): SeasonalDeflectionManifestValidator {
  return new SeasonalDeflectionManifestValidator(
    [
      new SeasonalDeflectionManifestCodeLengthRule(3600),
      new SeasonalDeflectionManifestOwnerIdLengthRule(64),
      new SeasonalDeflectionManifestRequiredOwnerIdRule("seasonal deflection manifest needs this field"),
      new SeasonalDeflectionManifestTitleLengthRule(120),
      new SeasonalDeflectionManifestCodePrefixRule("ACM"),
      new SeasonalDeflectionManifestOpenRateRangeRule(8.4, 4517.5),
    ],
  );
}
