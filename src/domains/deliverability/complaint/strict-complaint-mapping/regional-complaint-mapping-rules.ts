import { RegionalComplaintMapping } from "./regional-complaint-mapping.js";

/** A rule a regional complaint mapping must pass. Check returns its problems, or none. */
export interface RegionalComplaintMappingRule {
  check(item: RegionalComplaintMapping): string[];
}

export class RegionalComplaintMappingSequenceRangeRule implements RegionalComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalComplaintMapping): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalComplaintMappingRequiredNameRule implements RegionalComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalComplaintMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalComplaintMappingRequiredNotesRule implements RegionalComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalComplaintMapping): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional complaint mapping. */
export class RegionalComplaintMappingValidator {
  rules: RegionalComplaintMappingRule[];

  constructor(rules: RegionalComplaintMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalComplaintMapping): string[] {
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

  requireValid(item: RegionalComplaintMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalComplaintMapping[]): Map<string, string[]> {
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

export function defaultRegionalComplaintMappingValidator(): RegionalComplaintMappingValidator {
  return new RegionalComplaintMappingValidator(
    [
      new RegionalComplaintMappingSequenceRangeRule(255, 86400),
      new RegionalComplaintMappingRequiredNameRule("regional complaint mapping needs this field"),
      new RegionalComplaintMappingRequiredNotesRule("regional complaint mapping needs a value"),
    ],
  );
}
