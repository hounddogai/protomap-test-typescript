import { ManualSlaPlan } from "./manual-sla-plan.js";

/** A rule a manual sla plan must pass. Check returns its problems, or none. */
export interface ManualSlaPlanRule {
  check(item: ManualSlaPlan): string[];
}

export class ManualSlaPlanLabelLengthRule implements ManualSlaPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSlaPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualSlaPlanReviewerLengthRule implements ManualSlaPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSlaPlan): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualSlaPlanRequiredLabelRule implements ManualSlaPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaPlan): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual sla plan. */
export class ManualSlaPlanValidator {
  rules: ManualSlaPlanRule[];

  constructor(rules: ManualSlaPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSlaPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualSlaPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSlaPlan[]): Map<string, string[]> {
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

export function defaultManualSlaPlanValidator(): ManualSlaPlanValidator {
  return new ManualSlaPlanValidator(
    [
      new ManualSlaPlanLabelLengthRule(3600),
      new ManualSlaPlanReviewerLengthRule(16),
      new ManualSlaPlanRequiredLabelRule("manual sla plan needs a value"),
    ],
  );
}
