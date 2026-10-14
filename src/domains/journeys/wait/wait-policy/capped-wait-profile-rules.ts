import { CappedWaitProfile } from "./capped-wait-profile.js";

/** A rule a capped wait profile must pass. Check returns its problems, or none. */
export interface CappedWaitProfileRule {
  check(item: CappedWaitProfile): string[];
}

export class CappedWaitProfileRequiredSourceRule implements CappedWaitProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWaitProfile): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class CappedWaitProfileEndsAtRangeRule implements CappedWaitProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWaitProfile): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedWaitProfileMarginRangeRule implements CappedWaitProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWaitProfile): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped wait profile. */
export class CappedWaitProfileValidator {
  rules: CappedWaitProfileRule[];

  constructor(rules: CappedWaitProfileRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWaitProfile): string[] {
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

  requireValid(item: CappedWaitProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWaitProfile[]): Map<string, string[]> {
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

export function defaultCappedWaitProfileValidator(): CappedWaitProfileValidator {
  return new CappedWaitProfileValidator(
    [
      new CappedWaitProfileRequiredSourceRule("capped wait profile needs a value"),
      new CappedWaitProfileEndsAtRangeRule(120, 120),
      new CappedWaitProfileMarginRangeRule(6.1, 3222.2),
    ],
  );
}
