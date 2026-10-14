import { RollingComplaintTarget } from "./rolling-complaint-target.js";

/** A rule a rolling complaint target must pass. Check returns its problems, or none. */
export interface RollingComplaintTargetRule {
  check(item: RollingComplaintTarget): string[];
}

export class RollingComplaintTargetRequiredCodeRule implements RollingComplaintTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingComplaintTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingComplaintTargetSummaryLengthRule implements RollingComplaintTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingComplaintTarget): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingComplaintTargetRequiredNameRule implements RollingComplaintTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingComplaintTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingComplaintTargetRequiredCurrencyRule implements RollingComplaintTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingComplaintTarget): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling complaint target. */
export class RollingComplaintTargetValidator {
  rules: RollingComplaintTargetRule[];

  constructor(rules: RollingComplaintTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingComplaintTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingComplaintTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingComplaintTarget[]): Map<string, string[]> {
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

export function defaultRollingComplaintTargetValidator(): RollingComplaintTargetValidator {
  return new RollingComplaintTargetValidator(
    [
      new RollingComplaintTargetRequiredCodeRule("rolling complaint target needs an entry"),
      new RollingComplaintTargetSummaryLengthRule(255),
      new RollingComplaintTargetRequiredNameRule("rolling complaint target needs an entry"),
      new RollingComplaintTargetRequiredCurrencyRule("rolling complaint target needs a value"),
    ],
  );
}
