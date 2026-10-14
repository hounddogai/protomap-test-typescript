import { FunnelRollup } from "./funnel-rollup.js";

/** A rule a funnel rollup must pass. Check returns its problems, or none. */
export interface FunnelRollupRule {
  check(item: FunnelRollup): string[];
}

export class FunnelRollupRequiredNameRule implements FunnelRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelRollupCodePrefixRule implements FunnelRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelRollupCategoryLengthRule implements FunnelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRollup): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRollupAudienceIdLengthRule implements FunnelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRollup): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRollupAttemptsRangeRule implements FunnelRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelRollup): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a funnel rollup. */
export class FunnelRollupValidator {
  rules: FunnelRollupRule[];

  constructor(rules: FunnelRollupRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelRollup): string[] {
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

  requireValid(item: FunnelRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelRollup[]): Map<string, string[]> {
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

export function defaultFunnelRollupValidator(): FunnelRollupValidator {
  return new FunnelRollupValidator(
    [
      new FunnelRollupRequiredNameRule("funnel rollup needs a value"),
      new FunnelRollupCodePrefixRule("REF"),
      new FunnelRollupCategoryLengthRule(120),
      new FunnelRollupAudienceIdLengthRule(80),
      new FunnelRollupAttemptsRangeRule(80, 80),
    ],
  );
}
