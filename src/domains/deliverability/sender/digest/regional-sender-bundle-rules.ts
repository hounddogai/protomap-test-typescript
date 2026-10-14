import { RegionalSenderBundle } from "./regional-sender-bundle.js";

/** A rule a regional sender bundle must pass. Check returns its problems, or none. */
export interface RegionalSenderBundleRule {
  check(item: RegionalSenderBundle): string[];
}

export class RegionalSenderBundleRequiredOwnerIdRule implements RegionalSenderBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderBundle): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderBundleClicksRangeRule implements RegionalSenderBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderBundle): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSenderBundleRequiredLabelRule implements RegionalSenderBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderBundleCodePrefixRule implements RegionalSenderBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalSenderBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional sender bundle. */
export class RegionalSenderBundleValidator {
  rules: RegionalSenderBundleRule[];

  constructor(rules: RegionalSenderBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSenderBundle): string[] {
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

  requireValid(item: RegionalSenderBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSenderBundle[]): Map<string, string[]> {
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

export function defaultRegionalSenderBundleValidator(): RegionalSenderBundleValidator {
  return new RegionalSenderBundleValidator(
    [
      new RegionalSenderBundleRequiredOwnerIdRule("regional sender bundle needs an entry"),
      new RegionalSenderBundleClicksRangeRule(255, 1000),
      new RegionalSenderBundleRequiredLabelRule("regional sender bundle needs this field"),
      new RegionalSenderBundleCodePrefixRule("REF"),
    ],
  );
}
