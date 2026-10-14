import * as text from "../../../../kit/text.js";
import { LenientWarmupEntry } from "./lenient-warmup-entry.js";

/** A rule a lenient warmup entry must pass. Check returns its problems, or none. */
export interface LenientWarmupEntryRule {
  check(item: LenientWarmupEntry): string[];
}

export class LenientWarmupEntryRequiredTitleRule implements LenientWarmupEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupEntryAllowedCodeRule implements LenientWarmupEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWarmupEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class LenientWarmupEntryRequiredCodeRule implements LenientWarmupEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient warmup entry. */
export class LenientWarmupEntryValidator {
  rules: LenientWarmupEntryRule[];

  constructor(rules: LenientWarmupEntryRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWarmupEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientWarmupEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWarmupEntry[]): Map<string, string[]> {
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

export function defaultLenientWarmupEntryValidator(): LenientWarmupEntryValidator {
  return new LenientWarmupEntryValidator(
    [
      new LenientWarmupEntryRequiredTitleRule("lenient warmup entry needs an entry"),
      new LenientWarmupEntryAllowedCodeRule([]),
      new LenientWarmupEntryRequiredCodeRule("lenient warmup entry needs this field"),
    ],
  );
}
