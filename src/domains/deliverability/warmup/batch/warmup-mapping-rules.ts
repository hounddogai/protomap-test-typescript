import { WarmupMapping } from "./warmup-mapping.js";

/** A rule a warmup mapping must pass. Check returns its problems, or none. */
export interface WarmupMappingRule {
  check(item: WarmupMapping): string[];
}

export class WarmupMappingVisibleGuardRule implements WarmupMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WarmupMapping): string[] {
    if (item.visible && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class WarmupMappingBudgetRangeRule implements WarmupMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupMapping): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupMappingCodePrefixRule implements WarmupMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupMappingSendAtRangeRule implements WarmupMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupMapping): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a warmup mapping. */
export class WarmupMappingValidator {
  rules: WarmupMappingRule[];

  constructor(rules: WarmupMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupMapping): string[] {
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

  requireValid(item: WarmupMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupMapping[]): Map<string, string[]> {
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

export function defaultWarmupMappingValidator(): WarmupMappingValidator {
  return new WarmupMappingValidator(
    [
      new WarmupMappingVisibleGuardRule(3.4),
      new WarmupMappingBudgetRangeRule(5.5, 3341.5),
      new WarmupMappingCodePrefixRule("OPS"),
      new WarmupMappingSendAtRangeRule(64, 255),
    ],
  );
}
