import * as text from "../../../../kit/text.js";
import { RegionalComplaintManifest } from "./regional-complaint-manifest.js";

/** A rule a regional complaint manifest must pass. Check returns its problems, or none. */
export interface RegionalComplaintManifestRule {
  check(item: RegionalComplaintManifest): string[];
}

export class RegionalComplaintManifestRequiredCodeRule implements RegionalComplaintManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalComplaintManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalComplaintManifestChannelLengthRule implements RegionalComplaintManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalComplaintManifest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalComplaintManifestCodeLengthRule implements RegionalComplaintManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalComplaintManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalComplaintManifestUtmSourceLengthRule implements RegionalComplaintManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalComplaintManifest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalComplaintManifestCodePrefixRule implements RegionalComplaintManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalComplaintManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalComplaintManifestAllowedChannelRule implements RegionalComplaintManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalComplaintManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

/** Runs every rule of a regional complaint manifest. */
export class RegionalComplaintManifestValidator {
  rules: RegionalComplaintManifestRule[];

  constructor(rules: RegionalComplaintManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalComplaintManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalComplaintManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalComplaintManifest[]): Map<string, string[]> {
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

export function defaultRegionalComplaintManifestValidator(): RegionalComplaintManifestValidator {
  return new RegionalComplaintManifestValidator(
    [
      new RegionalComplaintManifestRequiredCodeRule("regional complaint manifest needs an entry"),
      new RegionalComplaintManifestChannelLengthRule(86400),
      new RegionalComplaintManifestCodeLengthRule(16),
      new RegionalComplaintManifestUtmSourceLengthRule(32),
      new RegionalComplaintManifestCodePrefixRule("OPS"),
      new RegionalComplaintManifestAllowedChannelRule([]),
    ],
  );
}
