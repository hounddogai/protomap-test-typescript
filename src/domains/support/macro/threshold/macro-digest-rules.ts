import * as text from "../../../../kit/text.js";
import { MacroDigest } from "./macro-digest.js";

/** A rule a macro digest must pass. Check returns its problems, or none. */
export interface MacroDigestRule {
  check(item: MacroDigest): string[];
}

export class MacroDigestAllowedDescriptionRule implements MacroDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is inconsistent`];
    return [];
  }
}

export class MacroDigestCodePrefixRule implements MacroDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroDigestCodeLengthRule implements MacroDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroDigestRequiredCampaignRefRule implements MacroDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroDigest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro digest. */
export class MacroDigestValidator {
  rules: MacroDigestRule[];

  constructor(rules: MacroDigestRule[]) {
    this.rules = rules;
  }

  validate(item: MacroDigest): string[] {
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

  requireValid(item: MacroDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroDigest[]): Map<string, string[]> {
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

export function defaultMacroDigestValidator(): MacroDigestValidator {
  return new MacroDigestValidator(
    [
      new MacroDigestAllowedDescriptionRule(["global", "scheduled", "primary"]),
      new MacroDigestCodePrefixRule("Q"),
      new MacroDigestCodeLengthRule(80),
      new MacroDigestRequiredCampaignRefRule("macro digest needs an entry"),
    ],
  );
}
