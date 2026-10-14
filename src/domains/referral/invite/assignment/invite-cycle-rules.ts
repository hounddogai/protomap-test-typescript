import { InviteCycle } from "./invite-cycle.js";

/** A rule a invite cycle must pass. Check returns its problems, or none. */
export interface InviteCycleRule {
  check(item: InviteCycle): string[];
}

export class InviteCycleRequiredCodeRule implements InviteCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteCycleVersionRangeRule implements InviteCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteCycle): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteCycleRequiredLabelRule implements InviteCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InviteCycleLabelLengthRule implements InviteCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteCycleJourneyIdLengthRule implements InviteCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteCycle): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite cycle. */
export class InviteCycleValidator {
  rules: InviteCycleRule[];

  constructor(rules: InviteCycleRule[]) {
    this.rules = rules;
  }

  validate(item: InviteCycle): string[] {
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

  requireValid(item: InviteCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteCycle[]): Map<string, string[]> {
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

export function defaultInviteCycleValidator(): InviteCycleValidator {
  return new InviteCycleValidator(
    [
      new InviteCycleRequiredCodeRule("invite cycle needs a value"),
      new InviteCycleVersionRangeRule(120, 86400),
      new InviteCycleRequiredLabelRule("invite cycle needs a value"),
      new InviteCycleLabelLengthRule(64),
      new InviteCycleJourneyIdLengthRule(16),
    ],
  );
}
