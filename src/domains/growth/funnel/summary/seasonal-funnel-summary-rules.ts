import { SeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

/** A rule a seasonal funnel summary must pass. Check returns its problems, or none. */
export interface SeasonalFunnelSummaryRule {
  check(item: SeasonalFunnelSummary): string[];
}

export class SeasonalFunnelSummaryRequiredCodeRule implements SeasonalFunnelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFunnelSummaryRequiredNameRule implements SeasonalFunnelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFunnelSummaryFloorValueRangeRule implements SeasonalFunnelSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFunnelSummary): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalFunnelSummaryLabelLengthRule implements SeasonalFunnelSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFunnelSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalFunnelSummaryRequiredChannelRule implements SeasonalFunnelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelSummary): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal funnel summary. */
export class SeasonalFunnelSummaryValidator {
  rules: SeasonalFunnelSummaryRule[];

  constructor(rules: SeasonalFunnelSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFunnelSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalFunnelSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFunnelSummary[]): Map<string, string[]> {
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

export function defaultSeasonalFunnelSummaryValidator(): SeasonalFunnelSummaryValidator {
  return new SeasonalFunnelSummaryValidator(
    [
      new SeasonalFunnelSummaryRequiredCodeRule("seasonal funnel summary needs an entry"),
      new SeasonalFunnelSummaryRequiredNameRule("seasonal funnel summary needs this field"),
      new SeasonalFunnelSummaryFloorValueRangeRule(1.3, 4407.4),
      new SeasonalFunnelSummaryLabelLengthRule(120),
      new SeasonalFunnelSummaryRequiredChannelRule("seasonal funnel summary needs an entry"),
    ],
  );
}
