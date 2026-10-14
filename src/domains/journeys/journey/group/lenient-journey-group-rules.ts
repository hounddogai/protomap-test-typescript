import { LenientJourneyGroup } from "./lenient-journey-group.js";

/** A rule a lenient journey group must pass. Check returns its problems, or none. */
export interface LenientJourneyGroupRule {
  check(item: LenientJourneyGroup): string[];
}

export class LenientJourneyGroupOwnerIdLengthRule implements LenientJourneyGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientJourneyGroup): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientJourneyGroupRequiredCodeRule implements LenientJourneyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientJourneyGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientJourneyGroupRequiredOwnerIdRule implements LenientJourneyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientJourneyGroup): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient journey group. */
export class LenientJourneyGroupValidator {
  rules: LenientJourneyGroupRule[];

  constructor(rules: LenientJourneyGroupRule[]) {
    this.rules = rules;
  }

  validate(item: LenientJourneyGroup): string[] {
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

  requireValid(item: LenientJourneyGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientJourneyGroup[]): Map<string, string[]> {
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

export function defaultLenientJourneyGroupValidator(): LenientJourneyGroupValidator {
  return new LenientJourneyGroupValidator(
    [
      new LenientJourneyGroupOwnerIdLengthRule(1000),
      new LenientJourneyGroupRequiredCodeRule("lenient journey group needs an entry"),
      new LenientJourneyGroupRequiredOwnerIdRule("lenient journey group needs an entry"),
    ],
  );
}
