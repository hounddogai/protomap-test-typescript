import * as text from "../../../../kit/text.js";
import { CappedCreativeBundle } from "./capped-creative-bundle.js";

/** A rule a capped creative bundle must pass. Check returns its problems, or none. */
export interface CappedCreativeBundleRule {
  check(item: CappedCreativeBundle): string[];
}

export class CappedCreativeBundleCurrencyLengthRule implements CappedCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreativeBundle): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCreativeBundleCodeLengthRule implements CappedCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreativeBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCreativeBundleUtmSourceLengthRule implements CappedCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreativeBundle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCreativeBundleRequiredCodeRule implements CappedCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreativeBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreativeBundleAllowedCurrencyRule implements CappedCreativeBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedCreativeBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is stale`];
    return [];
  }
}

export class CappedCreativeBundleTagsLimitRule implements CappedCreativeBundleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CappedCreativeBundle): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a capped creative bundle. */
export class CappedCreativeBundleValidator {
  rules: CappedCreativeBundleRule[];

  constructor(rules: CappedCreativeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCreativeBundle): string[] {
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

  requireValid(item: CappedCreativeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCreativeBundle[]): Map<string, string[]> {
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

export function defaultCappedCreativeBundleValidator(): CappedCreativeBundleValidator {
  return new CappedCreativeBundleValidator(
    [
      new CappedCreativeBundleCurrencyLengthRule(3600),
      new CappedCreativeBundleCodeLengthRule(80),
      new CappedCreativeBundleUtmSourceLengthRule(120),
      new CappedCreativeBundleRequiredCodeRule("capped creative bundle needs an entry"),
      new CappedCreativeBundleAllowedCurrencyRule(["global", "legacy", "strict"]),
      new CappedCreativeBundleTagsLimitRule(16, []),
    ],
  );
}
