import * as text from "../../../../kit/text.js";
import { StrictBranchManifest } from "./strict-branch-manifest.js";

/** A rule a strict branch manifest must pass. Check returns its problems, or none. */
export interface StrictBranchManifestRule {
  check(item: StrictBranchManifest): string[];
}

export class StrictBranchManifestAllowedChannelRule implements StrictBranchManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictBranchManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is below minimum`];
    return [];
  }
}

export class StrictBranchManifestCodePrefixRule implements StrictBranchManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictBranchManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictBranchManifestRequiredChannelRule implements StrictBranchManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBranchManifest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBranchManifestChannelLengthRule implements StrictBranchManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBranchManifest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBranchManifestRequiredCodeRule implements StrictBranchManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBranchManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict branch manifest. */
export class StrictBranchManifestValidator {
  rules: StrictBranchManifestRule[];

  constructor(rules: StrictBranchManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBranchManifest): string[] {
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

  requireValid(item: StrictBranchManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBranchManifest[]): Map<string, string[]> {
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

export function defaultStrictBranchManifestValidator(): StrictBranchManifestValidator {
  return new StrictBranchManifestValidator(
    [
      new StrictBranchManifestAllowedChannelRule(["tiered", "legacy", "regional"]),
      new StrictBranchManifestCodePrefixRule("Q"),
      new StrictBranchManifestRequiredChannelRule("strict branch manifest needs an entry"),
      new StrictBranchManifestChannelLengthRule(86400),
      new StrictBranchManifestRequiredCodeRule("strict branch manifest needs an entry"),
    ],
  );
}
