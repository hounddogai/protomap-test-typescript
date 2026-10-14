import * as text from "../../../../kit/text.js";
import { RegionalFunnelOverride } from "./regional-funnel-override.js";

/** A rule a regional funnel override must pass. Check returns its problems, or none. */
export interface RegionalFunnelOverrideRule {
  check(item: RegionalFunnelOverride): string[];
}

export class RegionalFunnelOverrideAmountRangeRule implements RegionalFunnelOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalFunnelOverride): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalFunnelOverrideRequiredTitleRule implements RegionalFunnelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalFunnelOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalFunnelOverrideAllowedTitleRule implements RegionalFunnelOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalFunnelOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class RegionalFunnelOverrideRateRangeRule implements RegionalFunnelOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalFunnelOverride): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional funnel override. */
export class RegionalFunnelOverrideValidator {
  rules: RegionalFunnelOverrideRule[];

  constructor(rules: RegionalFunnelOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalFunnelOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalFunnelOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalFunnelOverride[]): Map<string, string[]> {
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

export function defaultRegionalFunnelOverrideValidator(): RegionalFunnelOverrideValidator {
  return new RegionalFunnelOverrideValidator(
    [
      new RegionalFunnelOverrideAmountRangeRule(5.1, 987.4),
      new RegionalFunnelOverrideRequiredTitleRule("regional funnel override needs an entry"),
      new RegionalFunnelOverrideAllowedTitleRule(["tiered", "primary"]),
      new RegionalFunnelOverrideRateRangeRule(5.9, 1357.6),
    ],
  );
}
