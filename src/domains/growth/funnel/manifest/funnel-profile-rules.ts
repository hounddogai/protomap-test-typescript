import { FunnelProfile } from "./funnel-profile.js";

/** A rule a funnel profile must pass. Check returns its problems, or none. */
export interface FunnelProfileRule {
  check(item: FunnelProfile): string[];
}

export class FunnelProfileTitleLengthRule implements FunnelProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelProfileRequiredTitleRule implements FunnelProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelProfileLabelLengthRule implements FunnelProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel profile. */
export class FunnelProfileValidator {
  rules: FunnelProfileRule[];

  constructor(rules: FunnelProfileRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelProfile[]): Map<string, string[]> {
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

export function defaultFunnelProfileValidator(): FunnelProfileValidator {
  return new FunnelProfileValidator(
    [
      new FunnelProfileTitleLengthRule(1000),
      new FunnelProfileRequiredTitleRule("funnel profile needs an entry"),
      new FunnelProfileLabelLengthRule(16),
    ],
  );
}
