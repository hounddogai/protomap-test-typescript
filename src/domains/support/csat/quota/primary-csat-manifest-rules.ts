import * as text from "../../../../kit/text.js";
import { PrimaryCsatManifest } from "./primary-csat-manifest.js";

/** A rule a primary csat manifest must pass. Check returns its problems, or none. */
export interface PrimaryCsatManifestRule {
  check(item: PrimaryCsatManifest): string[];
}

export class PrimaryCsatManifestAllowedCodeRule implements PrimaryCsatManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryCsatManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class PrimaryCsatManifestRetriesRangeRule implements PrimaryCsatManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCsatManifest): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryCsatManifestRequiredNameRule implements PrimaryCsatManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCsatManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCsatManifestCodePrefixRule implements PrimaryCsatManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryCsatManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryCsatManifestRequiredCodeRule implements PrimaryCsatManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCsatManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary csat manifest. */
export class PrimaryCsatManifestValidator {
  rules: PrimaryCsatManifestRule[];

  constructor(rules: PrimaryCsatManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCsatManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryCsatManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCsatManifest[]): Map<string, string[]> {
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

export function defaultPrimaryCsatManifestValidator(): PrimaryCsatManifestValidator {
  return new PrimaryCsatManifestValidator(
    [
      new PrimaryCsatManifestAllowedCodeRule(["capped"]),
      new PrimaryCsatManifestRetriesRangeRule(16, 16),
      new PrimaryCsatManifestRequiredNameRule("primary csat manifest needs a value"),
      new PrimaryCsatManifestCodePrefixRule("REF"),
      new PrimaryCsatManifestRequiredCodeRule("primary csat manifest needs an entry"),
    ],
  );
}
