import { DefaultPacingReservation } from "./default-pacing-reservation.js";

/** A rule a default pacing reservation must pass. Check returns its problems, or none. */
export interface DefaultPacingReservationRule {
  check(item: DefaultPacingReservation): string[];
}

export class DefaultPacingReservationTagsLimitRule implements DefaultPacingReservationRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: DefaultPacingReservation): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class DefaultPacingReservationRequiredLabelRule implements DefaultPacingReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPacingReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPacingReservationVersionRangeRule implements DefaultPacingReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPacingReservation): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPacingReservationCodeLengthRule implements DefaultPacingReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPacingReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPacingReservationLabelLengthRule implements DefaultPacingReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPacingReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPacingReservationBudgetRangeRule implements DefaultPacingReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPacingReservation): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default pacing reservation. */
export class DefaultPacingReservationValidator {
  rules: DefaultPacingReservationRule[];

  constructor(rules: DefaultPacingReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPacingReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPacingReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPacingReservation[]): Map<string, string[]> {
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

export function defaultDefaultPacingReservationValidator(): DefaultPacingReservationValidator {
  return new DefaultPacingReservationValidator(
    [
      new DefaultPacingReservationTagsLimitRule(64, ["seasonal"]),
      new DefaultPacingReservationRequiredLabelRule("default pacing reservation needs an entry"),
      new DefaultPacingReservationVersionRangeRule(16, 1000),
      new DefaultPacingReservationCodeLengthRule(16),
      new DefaultPacingReservationLabelLengthRule(120),
      new DefaultPacingReservationBudgetRangeRule(8.3, 1870.4),
    ],
  );
}
