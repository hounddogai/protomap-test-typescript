import { DomainManifest } from "./domain-manifest.js";

/** A rule a domain manifest must pass. Check returns its problems, or none. */
export interface DomainManifestRule {
  check(item: DomainManifest): string[];
}

export class DomainManifestCampaignRefLengthRule implements DomainManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainManifest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainManifestMaximumRangeRule implements DomainManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainManifest): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainManifestRequiredCampaignRefRule implements DomainManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainManifest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class DomainManifestCodePrefixRule implements DomainManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a domain manifest. */
export class DomainManifestValidator {
  rules: DomainManifestRule[];

  constructor(rules: DomainManifestRule[]) {
    this.rules = rules;
  }

  validate(item: DomainManifest): string[] {
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

  requireValid(item: DomainManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainManifest[]): Map<string, string[]> {
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

export function defaultDomainManifestValidator(): DomainManifestValidator {
  return new DomainManifestValidator(
    [
      new DomainManifestCampaignRefLengthRule(3600),
      new DomainManifestMaximumRangeRule(1, 4193.8),
      new DomainManifestRequiredCampaignRefRule("domain manifest needs a value"),
      new DomainManifestCodePrefixRule("ACM"),
    ],
  );
}
