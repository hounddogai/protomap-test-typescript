import { StepSlot } from "./step-slot.js";

/** A rule a step slot must pass. Check returns its problems, or none. */
export interface StepSlotRule {
  check(item: StepSlot): string[];
}

export class StepSlotNotesLengthRule implements StepSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSlot): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepSlotReviewerLengthRule implements StepSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSlot): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepSlotRequiredNameRule implements StepSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step slot. */
export class StepSlotValidator {
  rules: StepSlotRule[];

  constructor(rules: StepSlotRule[]) {
    this.rules = rules;
  }

  validate(item: StepSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepSlot[]): Map<string, string[]> {
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

export function defaultStepSlotValidator(): StepSlotValidator {
  return new StepSlotValidator(
    [
      new StepSlotNotesLengthRule(3600),
      new StepSlotReviewerLengthRule(120),
      new StepSlotRequiredNameRule("step slot needs this field"),
    ],
  );
}
