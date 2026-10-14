import { DefaultPlacementMilestone } from "./default-placement-milestone.js";

/** A rule a default placement milestone must pass. Check returns its problems, or none. */
export interface DefaultPlacementMilestoneRule {
  check(item: DefaultPlacementMilestone): string[];
}

export class DefaultPlacementMilestoneNameLengthRule implements DefaultPlacementMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPlacementMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPlacementMilestoneRequiredNameRule implements DefaultPlacementMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPlacementMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPlacementMilestoneRequiredJourneyIdRule implements DefaultPlacementMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPlacementMilestone): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPlacementMilestoneJourneyIdLengthRule implements DefaultPlacementMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPlacementMilestone): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default placement milestone. */
export class DefaultPlacementMilestoneValidator {
  rules: DefaultPlacementMilestoneRule[];

  constructor(rules: DefaultPlacementMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPlacementMilestone): string[] {
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

  requireValid(item: DefaultPlacementMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPlacementMilestone[]): Map<string, string[]> {
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

export function defaultDefaultPlacementMilestoneValidator(): DefaultPlacementMilestoneValidator {
  return new DefaultPlacementMilestoneValidator(
    [
      new DefaultPlacementMilestoneNameLengthRule(1000),
      new DefaultPlacementMilestoneRequiredNameRule("default placement milestone needs this field"),
      new DefaultPlacementMilestoneRequiredJourneyIdRule("default placement milestone needs a value"),
      new DefaultPlacementMilestoneJourneyIdLengthRule(64),
    ],
  );
}
