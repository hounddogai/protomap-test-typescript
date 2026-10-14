import { WaitTarget } from "./wait-target.js";

/** A rule a wait target must pass. Check returns its problems, or none. */
export interface WaitTargetRule {
  check(item: WaitTarget): string[];
}

export class WaitTargetRequiredPhoneRule implements WaitTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitTarget): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WaitTargetRequiredSegmentRule implements WaitTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitTarget): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class WaitTargetArchivedGuardRule implements WaitTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WaitTarget): string[] {
    if (item.archived && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a wait target. */
export class WaitTargetValidator {
  rules: WaitTargetRule[];

  constructor(rules: WaitTargetRule[]) {
    this.rules = rules;
  }

  validate(item: WaitTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitTarget[]): Map<string, string[]> {
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

export function defaultWaitTargetValidator(): WaitTargetValidator {
  return new WaitTargetValidator(
    [
      new WaitTargetRequiredPhoneRule("wait target needs a value"),
      new WaitTargetRequiredSegmentRule("wait target needs this field"),
      new WaitTargetArchivedGuardRule(2.7),
    ],
  );
}
