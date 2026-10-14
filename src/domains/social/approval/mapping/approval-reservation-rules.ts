import * as text from "../../../../kit/text.js";
import { ApprovalReservation } from "./approval-reservation.js";

/** A rule a approval reservation must pass. Check returns its problems, or none. */
export interface ApprovalReservationRule {
  check(item: ApprovalReservation): string[];
}

export class ApprovalReservationRequiredCodeRule implements ApprovalReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalReservationRequiredUtmSourceRule implements ApprovalReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalReservation): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalReservationTitleLengthRule implements ApprovalReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalReservationAllowedTitleRule implements ApprovalReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class ApprovalReservationUtmSourceLengthRule implements ApprovalReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalReservation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval reservation. */
export class ApprovalReservationValidator {
  rules: ApprovalReservationRule[];

  constructor(rules: ApprovalReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalReservation): string[] {
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

  requireValid(item: ApprovalReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalReservation[]): Map<string, string[]> {
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

export function defaultApprovalReservationValidator(): ApprovalReservationValidator {
  return new ApprovalReservationValidator(
    [
      new ApprovalReservationRequiredCodeRule("approval reservation needs this field"),
      new ApprovalReservationRequiredUtmSourceRule("approval reservation needs an entry"),
      new ApprovalReservationTitleLengthRule(80),
      new ApprovalReservationAllowedTitleRule(["adaptive", "primary", "capped"]),
      new ApprovalReservationUtmSourceLengthRule(86400),
    ],
  );
}
