import { ActivationSegment } from "./activation-segment.js";

/** A rule a activation segment must pass. Check returns its problems, or none. */
export interface ActivationSegmentRule {
  check(item: ActivationSegment): string[];
}

export class ActivationSegmentEndsAtRangeRule implements ActivationSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationSegment): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationSegmentApprovedGuardRule implements ActivationSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ActivationSegment): string[] {
    if (item.approved && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ActivationSegmentCodePrefixRule implements ActivationSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a activation segment. */
export class ActivationSegmentValidator {
  rules: ActivationSegmentRule[];

  constructor(rules: ActivationSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationSegment): string[] {
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

  requireValid(item: ActivationSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationSegment[]): Map<string, string[]> {
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

export function defaultActivationSegmentValidator(): ActivationSegmentValidator {
  return new ActivationSegmentValidator(
    [
      new ActivationSegmentEndsAtRangeRule(64, 1000),
      new ActivationSegmentApprovedGuardRule(1000),
      new ActivationSegmentCodePrefixRule("ACM"),
    ],
  );
}
