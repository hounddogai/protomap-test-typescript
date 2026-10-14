import { PrimaryFunnelManifest } from "./primary-funnel-manifest.js";

/** A rule a primary funnel manifest must pass. Check returns its problems, or none. */
export interface PrimaryFunnelManifestRule {
  check(item: PrimaryFunnelManifest): string[];
}

export class PrimaryFunnelManifestRequiredLabelRule implements PrimaryFunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFunnelManifestLocaleLengthRule implements PrimaryFunnelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFunnelManifest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFunnelManifestCodePrefixRule implements PrimaryFunnelManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryFunnelManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryFunnelManifestVisibleGuardRule implements PrimaryFunnelManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryFunnelManifest): string[] {
    if (item.visible && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a primary funnel manifest. */
export class PrimaryFunnelManifestValidator {
  rules: PrimaryFunnelManifestRule[];

  constructor(rules: PrimaryFunnelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFunnelManifest): string[] {
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

  requireValid(item: PrimaryFunnelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFunnelManifest[]): Map<string, string[]> {
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

export function defaultPrimaryFunnelManifestValidator(): PrimaryFunnelManifestValidator {
  return new PrimaryFunnelManifestValidator(
    [
      new PrimaryFunnelManifestRequiredLabelRule("primary funnel manifest needs a value"),
      new PrimaryFunnelManifestLocaleLengthRule(64),
      new PrimaryFunnelManifestCodePrefixRule("Q"),
      new PrimaryFunnelManifestVisibleGuardRule(255),
    ],
  );
}
