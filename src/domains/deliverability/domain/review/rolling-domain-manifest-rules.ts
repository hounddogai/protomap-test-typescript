import * as text from "../../../../kit/text.js";
import { RollingDomainManifest } from "./rolling-domain-manifest.js";

/** A rule a rolling domain manifest must pass. Check returns its problems, or none. */
export interface RollingDomainManifestRule {
  check(item: RollingDomainManifest): string[];
}

export class RollingDomainManifestWindowDaysRangeRule implements RollingDomainManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDomainManifest): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingDomainManifestAllowedLabelRule implements RollingDomainManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingDomainManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class RollingDomainManifestCodePrefixRule implements RollingDomainManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingDomainManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling domain manifest. */
export class RollingDomainManifestValidator {
  rules: RollingDomainManifestRule[];

  constructor(rules: RollingDomainManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingDomainManifest): string[] {
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

  requireValid(item: RollingDomainManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingDomainManifest[]): Map<string, string[]> {
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

export function defaultRollingDomainManifestValidator(): RollingDomainManifestValidator {
  return new RollingDomainManifestValidator(
    [
      new RollingDomainManifestWindowDaysRangeRule(80, 80),
      new RollingDomainManifestAllowedLabelRule(["pending", "batched", "pending"]),
      new RollingDomainManifestCodePrefixRule("REF"),
    ],
  );
}
