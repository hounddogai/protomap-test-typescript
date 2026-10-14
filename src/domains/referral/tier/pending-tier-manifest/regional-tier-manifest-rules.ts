import { RegionalTierManifest } from "./regional-tier-manifest.js";

/** A rule a regional tier manifest must pass. Check returns its problems, or none. */
export interface RegionalTierManifestRule {
  check(item: RegionalTierManifest): string[];
}

export class RegionalTierManifestRequiredLabelRule implements RegionalTierManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalTierManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalTierManifestCodeLengthRule implements RegionalTierManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalTierManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalTierManifestEndsAtRangeRule implements RegionalTierManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalTierManifest): string[] {
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

export class RegionalTierManifestCodePrefixRule implements RegionalTierManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalTierManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional tier manifest. */
export class RegionalTierManifestValidator {
  rules: RegionalTierManifestRule[];

  constructor(rules: RegionalTierManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalTierManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalTierManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalTierManifest[]): Map<string, string[]> {
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

export function defaultRegionalTierManifestValidator(): RegionalTierManifestValidator {
  return new RegionalTierManifestValidator(
    [
      new RegionalTierManifestRequiredLabelRule("regional tier manifest needs a value"),
      new RegionalTierManifestCodeLengthRule(86400),
      new RegionalTierManifestEndsAtRangeRule(32, 32),
      new RegionalTierManifestCodePrefixRule("X"),
    ],
  );
}
