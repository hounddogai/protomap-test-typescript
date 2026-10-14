import { PacingAllocation } from "./pacing-allocation.js";

/** A rule a pacing allocation must pass. Check returns its problems, or none. */
export interface PacingAllocationRule {
  check(item: PacingAllocation): string[];
}

export class PacingAllocationRequiredCampaignRefRule implements PacingAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingAllocation): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class PacingAllocationNotesLengthRule implements PacingAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingAllocation): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingAllocationRequiredNotesRule implements PacingAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingAllocation): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing allocation. */
export class PacingAllocationValidator {
  rules: PacingAllocationRule[];

  constructor(rules: PacingAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PacingAllocation): string[] {
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

  requireValid(item: PacingAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingAllocation[]): Map<string, string[]> {
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

export function defaultPacingAllocationValidator(): PacingAllocationValidator {
  return new PacingAllocationValidator(
    [
      new PacingAllocationRequiredCampaignRefRule("pacing allocation needs a value"),
      new PacingAllocationNotesLengthRule(1000),
      new PacingAllocationRequiredNotesRule("pacing allocation needs an entry"),
    ],
  );
}
