import { RetentionManifest } from "./retention-manifest.js";

/** A rule a retention manifest must pass. Check returns its problems, or none. */
export interface RetentionManifestRule {
  check(item: RetentionManifest): string[];
}

export class RetentionManifestRequiredLabelRule implements RetentionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionManifestCampaignRefLengthRule implements RetentionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionManifest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionManifestRequiredCodeRule implements RetentionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionManifestLabelLengthRule implements RetentionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionManifestCodePrefixRule implements RetentionManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionManifestUnitLengthRule implements RetentionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionManifest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention manifest. */
export class RetentionManifestValidator {
  rules: RetentionManifestRule[];

  constructor(rules: RetentionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionManifest): string[] {
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

  requireValid(item: RetentionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionManifest[]): Map<string, string[]> {
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

export function defaultRetentionManifestValidator(): RetentionManifestValidator {
  return new RetentionManifestValidator(
    [
      new RetentionManifestRequiredLabelRule("retention manifest needs a value"),
      new RetentionManifestCampaignRefLengthRule(3600),
      new RetentionManifestRequiredCodeRule("retention manifest needs an entry"),
      new RetentionManifestLabelLengthRule(255),
      new RetentionManifestCodePrefixRule("OPS"),
      new RetentionManifestUnitLengthRule(86400),
    ],
  );
}
