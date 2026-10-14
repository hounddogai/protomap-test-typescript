import { JourneyRecord } from "./journey-record.js";

/** A rule a journey record must pass. Check returns its problems, or none. */
export interface JourneyRecordRule {
  check(item: JourneyRecord): string[];
}

export class JourneyRecordOwnerIdLengthRule implements JourneyRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyRecord): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyRecordRequiredLabelRule implements JourneyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRecordRequiredCodeRule implements JourneyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRecordRequiredDescriptionRule implements JourneyRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRecord): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRecordCodeLengthRule implements JourneyRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey record. */
export class JourneyRecordValidator {
  rules: JourneyRecordRule[];

  constructor(rules: JourneyRecordRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyRecord): string[] {
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

  requireValid(item: JourneyRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyRecord[]): Map<string, string[]> {
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

export function defaultJourneyRecordValidator(): JourneyRecordValidator {
  return new JourneyRecordValidator(
    [
      new JourneyRecordOwnerIdLengthRule(86400),
      new JourneyRecordRequiredLabelRule("journey record needs this field"),
      new JourneyRecordRequiredCodeRule("journey record needs an entry"),
      new JourneyRecordRequiredDescriptionRule("journey record needs a value"),
      new JourneyRecordCodeLengthRule(86400),
    ],
  );
}
