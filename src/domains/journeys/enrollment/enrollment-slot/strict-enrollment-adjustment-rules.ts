import { StrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

/** A rule a strict enrollment adjustment must pass. Check returns its problems, or none. */
export interface StrictEnrollmentAdjustmentRule {
  check(item: StrictEnrollmentAdjustment): string[];
}

export class StrictEnrollmentAdjustmentJourneyIdLengthRule implements StrictEnrollmentAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEnrollmentAdjustment): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictEnrollmentAdjustmentRequiredCodeRule implements StrictEnrollmentAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictEnrollmentAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictEnrollmentAdjustmentCodePrefixRule implements StrictEnrollmentAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictEnrollmentAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictEnrollmentAdjustmentNameLengthRule implements StrictEnrollmentAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEnrollmentAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictEnrollmentAdjustmentRequiredExternalRefRule implements StrictEnrollmentAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictEnrollmentAdjustment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict enrollment adjustment. */
export class StrictEnrollmentAdjustmentValidator {
  rules: StrictEnrollmentAdjustmentRule[];

  constructor(rules: StrictEnrollmentAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictEnrollmentAdjustment): string[] {
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

  requireValid(item: StrictEnrollmentAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictEnrollmentAdjustment[]): Map<string, string[]> {
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

export function defaultStrictEnrollmentAdjustmentValidator(): StrictEnrollmentAdjustmentValidator {
  return new StrictEnrollmentAdjustmentValidator(
    [
      new StrictEnrollmentAdjustmentJourneyIdLengthRule(3600),
      new StrictEnrollmentAdjustmentRequiredCodeRule("strict enrollment adjustment needs this field"),
      new StrictEnrollmentAdjustmentCodePrefixRule("OPS"),
      new StrictEnrollmentAdjustmentNameLengthRule(120),
      new StrictEnrollmentAdjustmentRequiredExternalRefRule("strict enrollment adjustment needs a value"),
    ],
  );
}
