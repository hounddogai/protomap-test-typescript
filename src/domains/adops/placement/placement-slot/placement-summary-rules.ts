import { PlacementSummary } from "./placement-summary.js";

/** A rule a placement summary must pass. Check returns its problems, or none. */
export interface PlacementSummaryRule {
  check(item: PlacementSummary): string[];
}

export class PlacementSummaryArchivedGuardRule implements PlacementSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementSummary): string[] {
    if (item.archived && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PlacementSummaryLabelLengthRule implements PlacementSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementSummaryRequiredLabelRule implements PlacementSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementSummaryCodeLengthRule implements PlacementSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement summary. */
export class PlacementSummaryValidator {
  rules: PlacementSummaryRule[];

  constructor(rules: PlacementSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementSummary[]): Map<string, string[]> {
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

export function defaultPlacementSummaryValidator(): PlacementSummaryValidator {
  return new PlacementSummaryValidator(
    [
      new PlacementSummaryArchivedGuardRule(4.1),
      new PlacementSummaryLabelLengthRule(255),
      new PlacementSummaryRequiredLabelRule("placement summary needs an entry"),
      new PlacementSummaryCodeLengthRule(80),
    ],
  );
}
