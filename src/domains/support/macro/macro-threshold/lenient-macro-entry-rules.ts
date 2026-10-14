import * as text from "../../../../kit/text.js";
import { LenientMacroEntry } from "./lenient-macro-entry.js";

/** A rule a lenient macro entry must pass. Check returns its problems, or none. */
export interface LenientMacroEntryRule {
  check(item: LenientMacroEntry): string[];
}

export class LenientMacroEntryLabelLengthRule implements LenientMacroEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMacroEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMacroEntryNameLengthRule implements LenientMacroEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMacroEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMacroEntryAllowedCampaignRefRule implements LenientMacroEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientMacroEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is inconsistent`];
    return [];
  }
}

export class LenientMacroEntryCodePrefixRule implements LenientMacroEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientMacroEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient macro entry. */
export class LenientMacroEntryValidator {
  rules: LenientMacroEntryRule[];

  constructor(rules: LenientMacroEntryRule[]) {
    this.rules = rules;
  }

  validate(item: LenientMacroEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientMacroEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientMacroEntry[]): Map<string, string[]> {
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

export function defaultLenientMacroEntryValidator(): LenientMacroEntryValidator {
  return new LenientMacroEntryValidator(
    [
      new LenientMacroEntryLabelLengthRule(86400),
      new LenientMacroEntryNameLengthRule(32),
      new LenientMacroEntryAllowedCampaignRefRule(["global", "capped"]),
      new LenientMacroEntryCodePrefixRule("REF"),
    ],
  );
}
