import { ManualNudgeOverride } from "./manual-nudge-override.js";

/** A rule a manual nudge override must pass. Check returns its problems, or none. */
export interface ManualNudgeOverrideRule {
  check(item: ManualNudgeOverride): string[];
}

export class ManualNudgeOverrideRequiredCohortRule implements ManualNudgeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualNudgeOverride): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ManualNudgeOverrideCodePrefixRule implements ManualNudgeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualNudgeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualNudgeOverrideLabelLengthRule implements ManualNudgeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualNudgeOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual nudge override. */
export class ManualNudgeOverrideValidator {
  rules: ManualNudgeOverrideRule[];

  constructor(rules: ManualNudgeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ManualNudgeOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualNudgeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualNudgeOverride[]): Map<string, string[]> {
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

export function defaultManualNudgeOverrideValidator(): ManualNudgeOverrideValidator {
  return new ManualNudgeOverrideValidator(
    [
      new ManualNudgeOverrideRequiredCohortRule("manual nudge override needs a value"),
      new ManualNudgeOverrideCodePrefixRule("REF"),
      new ManualNudgeOverrideLabelLengthRule(64),
    ],
  );
}
