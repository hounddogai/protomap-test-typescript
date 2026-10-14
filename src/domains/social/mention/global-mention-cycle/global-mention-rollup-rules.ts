import { GlobalMentionRollup } from "./global-mention-rollup.js";

/** A rule a global mention rollup must pass. Check returns its problems, or none. */
export interface GlobalMentionRollupRule {
  check(item: GlobalMentionRollup): string[];
}

export class GlobalMentionRollupCodePrefixRule implements GlobalMentionRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalMentionRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalMentionRollupRequiredCodeRule implements GlobalMentionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalMentionRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalMentionRollupLimitRangeRule implements GlobalMentionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalMentionRollup): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalMentionRollupQuantityRangeRule implements GlobalMentionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalMentionRollup): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalMentionRollupRequiredTitleRule implements GlobalMentionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalMentionRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global mention rollup. */
export class GlobalMentionRollupValidator {
  rules: GlobalMentionRollupRule[];

  constructor(rules: GlobalMentionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalMentionRollup): string[] {
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

  requireValid(item: GlobalMentionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalMentionRollup[]): Map<string, string[]> {
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

export function defaultGlobalMentionRollupValidator(): GlobalMentionRollupValidator {
  return new GlobalMentionRollupValidator(
    [
      new GlobalMentionRollupCodePrefixRule("OPS"),
      new GlobalMentionRollupRequiredCodeRule("global mention rollup needs an entry"),
      new GlobalMentionRollupLimitRangeRule(80, 1000),
      new GlobalMentionRollupQuantityRangeRule(16, 32),
      new GlobalMentionRollupRequiredTitleRule("global mention rollup needs an entry"),
    ],
  );
}
