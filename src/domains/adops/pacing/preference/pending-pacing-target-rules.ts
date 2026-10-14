import { PendingPacingTarget } from "./pending-pacing-target.js";

/** A rule a pending pacing target must pass. Check returns its problems, or none. */
export interface PendingPacingTargetRule {
  check(item: PendingPacingTarget): string[];
}

export class PendingPacingTargetLabelLengthRule implements PendingPacingTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPacingTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPacingTargetRequiredCodeRule implements PendingPacingTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPacingTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPacingTargetRequiredNameRule implements PendingPacingTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPacingTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPacingTargetRequiredLabelRule implements PendingPacingTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPacingTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending pacing target. */
export class PendingPacingTargetValidator {
  rules: PendingPacingTargetRule[];

  constructor(rules: PendingPacingTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPacingTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPacingTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPacingTarget[]): Map<string, string[]> {
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

export function defaultPendingPacingTargetValidator(): PendingPacingTargetValidator {
  return new PendingPacingTargetValidator(
    [
      new PendingPacingTargetLabelLengthRule(86400),
      new PendingPacingTargetRequiredCodeRule("pending pacing target needs an entry"),
      new PendingPacingTargetRequiredNameRule("pending pacing target needs this field"),
      new PendingPacingTargetRequiredLabelRule("pending pacing target needs this field"),
    ],
  );
}
