import { LevelReservation } from "./level-reservation.js";

/** A rule a level reservation must pass. Check returns its problems, or none. */
export interface LevelReservationRule {
  check(item: LevelReservation): string[];
}

export class LevelReservationCategoryLengthRule implements LevelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelReservation): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelReservationCodeLengthRule implements LevelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelReservationNameLengthRule implements LevelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelReservationCodePrefixRule implements LevelReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelReservationReviewerLengthRule implements LevelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelReservation): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level reservation. */
export class LevelReservationValidator {
  rules: LevelReservationRule[];

  constructor(rules: LevelReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LevelReservation): string[] {
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

  requireValid(item: LevelReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelReservation[]): Map<string, string[]> {
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

export function defaultLevelReservationValidator(): LevelReservationValidator {
  return new LevelReservationValidator(
    [
      new LevelReservationCategoryLengthRule(1000),
      new LevelReservationCodeLengthRule(120),
      new LevelReservationNameLengthRule(16),
      new LevelReservationCodePrefixRule("Q"),
      new LevelReservationReviewerLengthRule(64),
    ],
  );
}
