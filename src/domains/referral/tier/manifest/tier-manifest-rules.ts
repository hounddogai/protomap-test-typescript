import * as text from "../../../../kit/text.js";
import { TierManifest } from "./tier-manifest.js";

/** A rule a tier manifest must pass. Check returns its problems, or none. */
export interface TierManifestRule {
  check(item: TierManifest): string[];
}

export class TierManifestAllowedChannelRule implements TierManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is unknown`];
    return [];
  }
}

export class TierManifestCodePrefixRule implements TierManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TierManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TierManifestRequiredChannelRule implements TierManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierManifest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TierManifestRequiredCodeRule implements TierManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierManifestChannelLengthRule implements TierManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierManifest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierManifestRequiredNameRule implements TierManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier manifest. */
export class TierManifestValidator {
  rules: TierManifestRule[];

  constructor(rules: TierManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TierManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierManifest[]): Map<string, string[]> {
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

export function defaultTierManifestValidator(): TierManifestValidator {
  return new TierManifestValidator(
    [
      new TierManifestAllowedChannelRule([]),
      new TierManifestCodePrefixRule("OPS"),
      new TierManifestRequiredChannelRule("tier manifest needs this field"),
      new TierManifestRequiredCodeRule("tier manifest needs an entry"),
      new TierManifestChannelLengthRule(86400),
      new TierManifestRequiredNameRule("tier manifest needs this field"),
    ],
  );
}
