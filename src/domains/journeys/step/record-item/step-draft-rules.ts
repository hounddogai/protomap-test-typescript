import { StepDraft } from "./step-draft.js";

/** A rule a step draft must pass. Check returns its problems, or none. */
export interface StepDraftRule {
  check(item: StepDraft): string[];
}

export class StepDraftRequiredCodeRule implements StepDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepDraftVariantLengthRule implements StepDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepDraft): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepDraftRequiredLabelRule implements StepDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step draft. */
export class StepDraftValidator {
  rules: StepDraftRule[];

  constructor(rules: StepDraftRule[]) {
    this.rules = rules;
  }

  validate(item: StepDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepDraft[]): Map<string, string[]> {
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

export function defaultStepDraftValidator(): StepDraftValidator {
  return new StepDraftValidator(
    [
      new StepDraftRequiredCodeRule("step draft needs an entry"),
      new StepDraftVariantLengthRule(16),
      new StepDraftRequiredLabelRule("step draft needs an entry"),
    ],
  );
}
