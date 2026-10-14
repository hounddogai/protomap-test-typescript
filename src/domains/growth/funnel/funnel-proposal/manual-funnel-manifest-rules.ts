import * as text from "../../../../kit/text.js";
import { ManualFunnelManifest } from "./manual-funnel-manifest.js";

/** A rule a manual funnel manifest must pass. Check returns its problems, or none. */
export interface ManualFunnelManifestRule {
  check(item: ManualFunnelManifest): string[];
}

export class ManualFunnelManifestOpenRateRangeRule implements ManualFunnelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFunnelManifest): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFunnelManifestCategoryLengthRule implements ManualFunnelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFunnelManifest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFunnelManifestRequiredCategoryRule implements ManualFunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFunnelManifest): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFunnelManifestNameLengthRule implements ManualFunnelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFunnelManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFunnelManifestAllowedCodeRule implements ManualFunnelManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFunnelManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a manual funnel manifest. */
export class ManualFunnelManifestValidator {
  rules: ManualFunnelManifestRule[];

  constructor(rules: ManualFunnelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFunnelManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFunnelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFunnelManifest[]): Map<string, string[]> {
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

export function defaultManualFunnelManifestValidator(): ManualFunnelManifestValidator {
  return new ManualFunnelManifestValidator(
    [
      new ManualFunnelManifestOpenRateRangeRule(8.5, 3722.9),
      new ManualFunnelManifestCategoryLengthRule(1000),
      new ManualFunnelManifestRequiredCategoryRule("manual funnel manifest needs this field"),
      new ManualFunnelManifestNameLengthRule(3600),
      new ManualFunnelManifestAllowedCodeRule([]),
    ],
  );
}
