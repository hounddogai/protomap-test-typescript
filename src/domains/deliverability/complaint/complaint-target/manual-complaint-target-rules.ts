import { ManualComplaintTarget } from "./manual-complaint-target.js";

/** A rule a manual complaint target must pass. Check returns its problems, or none. */
export interface ManualComplaintTargetRule {
  check(item: ManualComplaintTarget): string[];
}

export class ManualComplaintTargetRequiredLocaleRule implements ManualComplaintTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualComplaintTarget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ManualComplaintTargetLocaleLengthRule implements ManualComplaintTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualComplaintTarget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualComplaintTargetRequiredCodeRule implements ManualComplaintTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualComplaintTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualComplaintTargetJourneyIdLengthRule implements ManualComplaintTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualComplaintTarget): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualComplaintTargetRequiredJourneyIdRule implements ManualComplaintTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualComplaintTarget): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual complaint target. */
export class ManualComplaintTargetValidator {
  rules: ManualComplaintTargetRule[];

  constructor(rules: ManualComplaintTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ManualComplaintTarget): string[] {
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

  requireValid(item: ManualComplaintTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualComplaintTarget[]): Map<string, string[]> {
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

export function defaultManualComplaintTargetValidator(): ManualComplaintTargetValidator {
  return new ManualComplaintTargetValidator(
    [
      new ManualComplaintTargetRequiredLocaleRule("manual complaint target needs this field"),
      new ManualComplaintTargetLocaleLengthRule(120),
      new ManualComplaintTargetRequiredCodeRule("manual complaint target needs this field"),
      new ManualComplaintTargetJourneyIdLengthRule(80),
      new ManualComplaintTargetRequiredJourneyIdRule("manual complaint target needs a value"),
    ],
  );
}
