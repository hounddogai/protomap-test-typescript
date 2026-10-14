import { StepCycle } from "./step-cycle.js";

/** A rule a step cycle must pass. Check returns its problems, or none. */
export interface StepCycleRule {
  check(item: StepCycle): string[];
}

export class StepCycleRegionLengthRule implements StepCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepCycle): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepCycleNameLengthRule implements StepCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepCycleRequiredAudienceIdRule implements StepCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepCycle): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step cycle. */
export class StepCycleValidator {
  rules: StepCycleRule[];

  constructor(rules: StepCycleRule[]) {
    this.rules = rules;
  }

  validate(item: StepCycle): string[] {
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

  requireValid(item: StepCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepCycle[]): Map<string, string[]> {
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

export function defaultStepCycleValidator(): StepCycleValidator {
  return new StepCycleValidator(
    [
      new StepCycleRegionLengthRule(120),
      new StepCycleNameLengthRule(3600),
      new StepCycleRequiredAudienceIdRule("step cycle needs this field"),
    ],
  );
}
