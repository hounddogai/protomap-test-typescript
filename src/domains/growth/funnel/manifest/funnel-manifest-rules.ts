import * as text from "../../../../kit/text.js";
import { FunnelManifest } from "./funnel-manifest.js";

/** A rule a funnel manifest must pass. Check returns its problems, or none. */
export interface FunnelManifestRule {
  check(item: FunnelManifest): string[];
}

export class FunnelManifestRequiredSummaryRule implements FunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelManifest): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelManifestRequiredLabelRule implements FunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelManifestAllowedCurrencyRule implements FunnelManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is inconsistent`];
    return [];
  }
}

export class FunnelManifestCodePrefixRule implements FunnelManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a funnel manifest. */
export class FunnelManifestValidator {
  rules: FunnelManifestRule[];

  constructor(rules: FunnelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelManifest): string[] {
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

  requireValid(item: FunnelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelManifest[]): Map<string, string[]> {
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

export function defaultFunnelManifestValidator(): FunnelManifestValidator {
  return new FunnelManifestValidator(
    [
      new FunnelManifestRequiredSummaryRule("funnel manifest needs this field"),
      new FunnelManifestRequiredLabelRule("funnel manifest needs this field"),
      new FunnelManifestAllowedCurrencyRule(["tiered", "scheduled"]),
      new FunnelManifestCodePrefixRule("ACM"),
    ],
  );
}
