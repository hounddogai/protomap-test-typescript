import { FallbackWarmupEntry } from "./fallback-warmup-entry.js";

/** A rule a fallback warmup entry must pass. Check returns its problems, or none. */
export interface FallbackWarmupEntryRule {
  check(item: FallbackWarmupEntry): string[];
}

export class FallbackWarmupEntryRequiredCodeRule implements FallbackWarmupEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWarmupEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWarmupEntryRequiredTitleRule implements FallbackWarmupEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWarmupEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWarmupEntryVariantLengthRule implements FallbackWarmupEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackWarmupEntry): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback warmup entry. */
export class FallbackWarmupEntryValidator {
  rules: FallbackWarmupEntryRule[];

  constructor(rules: FallbackWarmupEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackWarmupEntry): string[] {
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

  requireValid(item: FallbackWarmupEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackWarmupEntry[]): Map<string, string[]> {
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

export function defaultFallbackWarmupEntryValidator(): FallbackWarmupEntryValidator {
  return new FallbackWarmupEntryValidator(
    [
      new FallbackWarmupEntryRequiredCodeRule("fallback warmup entry needs a value"),
      new FallbackWarmupEntryRequiredTitleRule("fallback warmup entry needs a value"),
      new FallbackWarmupEntryVariantLengthRule(64),
    ],
  );
}
