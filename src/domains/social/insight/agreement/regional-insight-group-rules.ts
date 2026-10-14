import { RegionalInsightGroup } from "./regional-insight-group.js";

/** A rule a regional insight group must pass. Check returns its problems, or none. */
export interface RegionalInsightGroupRule {
  check(item: RegionalInsightGroup): string[];
}

export class RegionalInsightGroupLabelLengthRule implements RegionalInsightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInsightGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalInsightGroupRequiredLabelRule implements RegionalInsightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInsightGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInsightGroupDescriptionLengthRule implements RegionalInsightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInsightGroup): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional insight group. */
export class RegionalInsightGroupValidator {
  rules: RegionalInsightGroupRule[];

  constructor(rules: RegionalInsightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalInsightGroup): string[] {
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

  requireValid(item: RegionalInsightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalInsightGroup[]): Map<string, string[]> {
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

export function defaultRegionalInsightGroupValidator(): RegionalInsightGroupValidator {
  return new RegionalInsightGroupValidator(
    [
      new RegionalInsightGroupLabelLengthRule(16),
      new RegionalInsightGroupRequiredLabelRule("regional insight group needs this field"),
      new RegionalInsightGroupDescriptionLengthRule(255),
    ],
  );
}
