import { SeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

/** A rule a seasonal insight assignment must pass. Check returns its problems, or none. */
export interface SeasonalInsightAssignmentRule {
  check(item: SeasonalInsightAssignment): string[];
}

export class SeasonalInsightAssignmentCodePrefixRule implements SeasonalInsightAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalInsightAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalInsightAssignmentRequiredJourneyIdRule implements SeasonalInsightAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInsightAssignment): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalInsightAssignmentRequiredNameRule implements SeasonalInsightAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInsightAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal insight assignment. */
export class SeasonalInsightAssignmentValidator {
  rules: SeasonalInsightAssignmentRule[];

  constructor(rules: SeasonalInsightAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInsightAssignment): string[] {
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

  requireValid(item: SeasonalInsightAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInsightAssignment[]): Map<string, string[]> {
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

export function defaultSeasonalInsightAssignmentValidator(): SeasonalInsightAssignmentValidator {
  return new SeasonalInsightAssignmentValidator(
    [
      new SeasonalInsightAssignmentCodePrefixRule("OPS"),
      new SeasonalInsightAssignmentRequiredJourneyIdRule("seasonal insight assignment needs this field"),
      new SeasonalInsightAssignmentRequiredNameRule("seasonal insight assignment needs a value"),
    ],
  );
}
