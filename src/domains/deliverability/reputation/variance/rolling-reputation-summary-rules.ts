import * as text from "../../../../kit/text.js";
import { RollingReputationSummary } from "./rolling-reputation-summary.js";

/** A rule a rolling reputation summary must pass. Check returns its problems, or none. */
export interface RollingReputationSummaryRule {
  check(item: RollingReputationSummary): string[];
}

export class RollingReputationSummaryRequiredTimezoneRule implements RollingReputationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingReputationSummary): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RollingReputationSummaryRequiredLocaleRule implements RollingReputationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingReputationSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RollingReputationSummaryAllowedTimezoneRule implements RollingReputationSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingReputationSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is inconsistent`];
    return [];
  }
}

export class RollingReputationSummaryRequiredTitleRule implements RollingReputationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingReputationSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingReputationSummaryPriorityRangeRule implements RollingReputationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingReputationSummary): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingReputationSummaryCodePrefixRule implements RollingReputationSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingReputationSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling reputation summary. */
export class RollingReputationSummaryValidator {
  rules: RollingReputationSummaryRule[];

  constructor(rules: RollingReputationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingReputationSummary): string[] {
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

  requireValid(item: RollingReputationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingReputationSummary[]): Map<string, string[]> {
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

export function defaultRollingReputationSummaryValidator(): RollingReputationSummaryValidator {
  return new RollingReputationSummaryValidator(
    [
      new RollingReputationSummaryRequiredTimezoneRule("rolling reputation summary needs an entry"),
      new RollingReputationSummaryRequiredLocaleRule("rolling reputation summary needs an entry"),
      new RollingReputationSummaryAllowedTimezoneRule(["primary", "scheduled", "primary"]),
      new RollingReputationSummaryRequiredTitleRule("rolling reputation summary needs this field"),
      new RollingReputationSummaryPriorityRangeRule(16, 86400),
      new RollingReputationSummaryCodePrefixRule("OPS"),
    ],
  );
}
