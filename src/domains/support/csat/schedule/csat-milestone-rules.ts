import { CsatMilestone } from "./csat-milestone.js";

/** A rule a csat milestone must pass. Check returns its problems, or none. */
export interface CsatMilestoneRule {
  check(item: CsatMilestone): string[];
}

export class CsatMilestoneRequiredExternalRefRule implements CsatMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatMilestone): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class CsatMilestoneTitleLengthRule implements CsatMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatMilestoneRequiredJourneyIdRule implements CsatMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatMilestone): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class CsatMilestoneScoreRangeRule implements CsatMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatMilestone): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatMilestoneRequiredTitleRule implements CsatMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CsatMilestoneCodeLengthRule implements CsatMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat milestone. */
export class CsatMilestoneValidator {
  rules: CsatMilestoneRule[];

  constructor(rules: CsatMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: CsatMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatMilestone[]): Map<string, string[]> {
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

export function defaultCsatMilestoneValidator(): CsatMilestoneValidator {
  return new CsatMilestoneValidator(
    [
      new CsatMilestoneRequiredExternalRefRule("csat milestone needs an entry"),
      new CsatMilestoneTitleLengthRule(32),
      new CsatMilestoneRequiredJourneyIdRule("csat milestone needs this field"),
      new CsatMilestoneScoreRangeRule(6.3, 1337.8),
      new CsatMilestoneRequiredTitleRule("csat milestone needs a value"),
      new CsatMilestoneCodeLengthRule(32),
    ],
  );
}
