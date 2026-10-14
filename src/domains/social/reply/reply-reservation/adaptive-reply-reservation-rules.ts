import * as text from "../../../../kit/text.js";
import { AdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

/** A rule a adaptive reply reservation must pass. Check returns its problems, or none. */
export interface AdaptiveReplyReservationRule {
  check(item: AdaptiveReplyReservation): string[];
}

export class AdaptiveReplyReservationRequiredTitleRule implements AdaptiveReplyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveReplyReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveReplyReservationApprovedGuardRule implements AdaptiveReplyReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveReplyReservation): string[] {
    if (item.approved && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class AdaptiveReplyReservationCodePrefixRule implements AdaptiveReplyReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveReplyReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveReplyReservationAllowedOwnerIdRule implements AdaptiveReplyReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveReplyReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is blocked`];
    return [];
  }
}

export class AdaptiveReplyReservationTitleLengthRule implements AdaptiveReplyReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReplyReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive reply reservation. */
export class AdaptiveReplyReservationValidator {
  rules: AdaptiveReplyReservationRule[];

  constructor(rules: AdaptiveReplyReservationRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveReplyReservation): string[] {
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

  requireValid(item: AdaptiveReplyReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveReplyReservation[]): Map<string, string[]> {
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

export function defaultAdaptiveReplyReservationValidator(): AdaptiveReplyReservationValidator {
  return new AdaptiveReplyReservationValidator(
    [
      new AdaptiveReplyReservationRequiredTitleRule("adaptive reply reservation needs a value"),
      new AdaptiveReplyReservationApprovedGuardRule(64),
      new AdaptiveReplyReservationCodePrefixRule("X"),
      new AdaptiveReplyReservationAllowedOwnerIdRule(["weighted", "global"]),
      new AdaptiveReplyReservationTitleLengthRule(3600),
    ],
  );
}
