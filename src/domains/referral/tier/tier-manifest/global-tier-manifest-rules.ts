import * as text from "../../../../kit/text.js";
import { GlobalTierManifest } from "./global-tier-manifest.js";

/** A rule a global tier manifest must pass. Check returns its problems, or none. */
export interface GlobalTierManifestRule {
  check(item: GlobalTierManifest): string[];
}

export class GlobalTierManifestRequiredCodeRule implements GlobalTierManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTierManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalTierManifestCodePrefixRule implements GlobalTierManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalTierManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalTierManifestRequiredNameRule implements GlobalTierManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTierManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalTierManifestAllowedPhoneRule implements GlobalTierManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalTierManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is above maximum`];
    return [];
  }
}

export class GlobalTierManifestPhoneLengthRule implements GlobalTierManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTierManifest): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global tier manifest. */
export class GlobalTierManifestValidator {
  rules: GlobalTierManifestRule[];

  constructor(rules: GlobalTierManifestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalTierManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalTierManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalTierManifest[]): Map<string, string[]> {
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

export function defaultGlobalTierManifestValidator(): GlobalTierManifestValidator {
  return new GlobalTierManifestValidator(
    [
      new GlobalTierManifestRequiredCodeRule("global tier manifest needs an entry"),
      new GlobalTierManifestCodePrefixRule("REF"),
      new GlobalTierManifestRequiredNameRule("global tier manifest needs this field"),
      new GlobalTierManifestAllowedPhoneRule(["default", "default"]),
      new GlobalTierManifestPhoneLengthRule(3600),
    ],
  );
}
