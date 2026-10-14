import { ManualTouchpointSegment } from "./manual-touchpoint-segment.js";

/** A rule a manual touchpoint segment must pass. Check returns its problems, or none. */
export interface ManualTouchpointSegmentRule {
  check(item: ManualTouchpointSegment): string[];
}

export class ManualTouchpointSegmentRequiredCategoryRule implements ManualTouchpointSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTouchpointSegment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTouchpointSegmentRateRangeRule implements ManualTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointSegment): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTouchpointSegmentCodePrefixRule implements ManualTouchpointSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualTouchpointSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualTouchpointSegmentPriorityRangeRule implements ManualTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointSegment): string[] {
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

export class ManualTouchpointSegmentRequiredCodeRule implements ManualTouchpointSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTouchpointSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTouchpointSegmentCostRangeRule implements ManualTouchpointSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointSegment): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual touchpoint segment. */
export class ManualTouchpointSegmentValidator {
  rules: ManualTouchpointSegmentRule[];

  constructor(rules: ManualTouchpointSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTouchpointSegment): string[] {
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

  requireValid(item: ManualTouchpointSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTouchpointSegment[]): Map<string, string[]> {
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

export function defaultManualTouchpointSegmentValidator(): ManualTouchpointSegmentValidator {
  return new ManualTouchpointSegmentValidator(
    [
      new ManualTouchpointSegmentRequiredCategoryRule("manual touchpoint segment needs a value"),
      new ManualTouchpointSegmentRateRangeRule(5.8, 3815),
      new ManualTouchpointSegmentCodePrefixRule("Q"),
      new ManualTouchpointSegmentPriorityRangeRule(64, 120),
      new ManualTouchpointSegmentRequiredCodeRule("manual touchpoint segment needs an entry"),
      new ManualTouchpointSegmentCostRangeRule(7.7, 899.9),
    ],
  );
}
