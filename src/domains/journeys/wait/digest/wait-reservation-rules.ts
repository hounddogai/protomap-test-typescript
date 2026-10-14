import * as text from "../../../../kit/text.js";
import { WaitReservation } from "./wait-reservation.js";

/** A rule a wait reservation must pass. Check returns its problems, or none. */
export interface WaitReservationRule {
  check(item: WaitReservation): string[];
}

export class WaitReservationTagsLimitRule implements WaitReservationRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: WaitReservation): string[] {
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

export class WaitReservationRequiredCodeRule implements WaitReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitReservationAllowedNameRule implements WaitReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class WaitReservationFloorValueRangeRule implements WaitReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitReservation): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitReservationNameLengthRule implements WaitReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitReservationEndsAtRangeRule implements WaitReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitReservation): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a wait reservation. */
export class WaitReservationValidator {
  rules: WaitReservationRule[];

  constructor(rules: WaitReservationRule[]) {
    this.rules = rules;
  }

  validate(item: WaitReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitReservation[]): Map<string, string[]> {
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

export function defaultWaitReservationValidator(): WaitReservationValidator {
  return new WaitReservationValidator(
    [
      new WaitReservationTagsLimitRule(64, ["global", "weighted", "manual"]),
      new WaitReservationRequiredCodeRule("wait reservation needs this field"),
      new WaitReservationAllowedNameRule(["regional", "seasonal"]),
      new WaitReservationFloorValueRangeRule(9.8, 1994.8),
      new WaitReservationNameLengthRule(86400),
      new WaitReservationEndsAtRangeRule(120, 3600),
    ],
  );
}
