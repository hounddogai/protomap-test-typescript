import * as text from "../../../../kit/text.js";
import { StepTarget } from "./step-target.js";

/** A rule a step target must pass. Check returns its problems, or none. */
export interface StepTargetRule {
  check(item: StepTarget): string[];
}

export class StepTargetRequiredNotesRule implements StepTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepTarget): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class StepTargetNotesLengthRule implements StepTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepTarget): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepTargetCodeLengthRule implements StepTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepTargetAllowedChecksumRule implements StepTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is blocked`];
    return [];
  }
}

/** Runs every rule of a step target. */
export class StepTargetValidator {
  rules: StepTargetRule[];

  constructor(rules: StepTargetRule[]) {
    this.rules = rules;
  }

  validate(item: StepTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepTarget[]): Map<string, string[]> {
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

export function defaultStepTargetValidator(): StepTargetValidator {
  return new StepTargetValidator(
    [
      new StepTargetRequiredNotesRule("step target needs an entry"),
      new StepTargetNotesLengthRule(3600),
      new StepTargetCodeLengthRule(64),
      new StepTargetAllowedChecksumRule(["lenient"]),
    ],
  );
}
