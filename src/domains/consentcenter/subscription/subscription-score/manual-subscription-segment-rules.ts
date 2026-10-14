import { ManualSubscriptionSegment } from "./manual-subscription-segment.js";

/** A rule a manual subscription segment must pass. Check returns its problems, or none. */
export interface ManualSubscriptionSegmentRule {
  check(item: ManualSubscriptionSegment): string[];
}

export class ManualSubscriptionSegmentVisibleGuardRule implements ManualSubscriptionSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualSubscriptionSegment): string[] {
    if (item.visible && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ManualSubscriptionSegmentCodePrefixRule implements ManualSubscriptionSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualSubscriptionSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualSubscriptionSegmentRequiredCodeRule implements ManualSubscriptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSubscriptionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSubscriptionSegmentCostRangeRule implements ManualSubscriptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSubscriptionSegment): string[] {
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

export class ManualSubscriptionSegmentVersionRangeRule implements ManualSubscriptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSubscriptionSegment): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual subscription segment. */
export class ManualSubscriptionSegmentValidator {
  rules: ManualSubscriptionSegmentRule[];

  constructor(rules: ManualSubscriptionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSubscriptionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualSubscriptionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSubscriptionSegment[]): Map<string, string[]> {
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

export function defaultManualSubscriptionSegmentValidator(): ManualSubscriptionSegmentValidator {
  return new ManualSubscriptionSegmentValidator(
    [
      new ManualSubscriptionSegmentVisibleGuardRule(6.5),
      new ManualSubscriptionSegmentCodePrefixRule("OPS"),
      new ManualSubscriptionSegmentRequiredCodeRule("manual subscription segment needs an entry"),
      new ManualSubscriptionSegmentCostRangeRule(7.5, 2646),
      new ManualSubscriptionSegmentVersionRangeRule(80, 255),
    ],
  );
}
