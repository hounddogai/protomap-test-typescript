import { GlobalEscalationSummary } from "./global-escalation-summary.js";

/** A rule a global escalation summary must pass. Check returns its problems, or none. */
export interface GlobalEscalationSummaryRule {
  check(item: GlobalEscalationSummary): string[];
}

export class GlobalEscalationSummaryRegionLengthRule implements GlobalEscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEscalationSummary): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEscalationSummaryRequiredCodeRule implements GlobalEscalationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEscalationSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalEscalationSummaryNameLengthRule implements GlobalEscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEscalationSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEscalationSummaryImpressionsRangeRule implements GlobalEscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEscalationSummary): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global escalation summary. */
export class GlobalEscalationSummaryValidator {
  rules: GlobalEscalationSummaryRule[];

  constructor(rules: GlobalEscalationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalEscalationSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalEscalationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalEscalationSummary[]): Map<string, string[]> {
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

export function defaultGlobalEscalationSummaryValidator(): GlobalEscalationSummaryValidator {
  return new GlobalEscalationSummaryValidator(
    [
      new GlobalEscalationSummaryRegionLengthRule(32),
      new GlobalEscalationSummaryRequiredCodeRule("global escalation summary needs this field"),
      new GlobalEscalationSummaryNameLengthRule(86400),
      new GlobalEscalationSummaryImpressionsRangeRule(1000, 3600),
    ],
  );
}
