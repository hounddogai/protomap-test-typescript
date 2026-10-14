import { PendingReplyReservation } from "./pending-reply-reservation.js";

/** A rule a pending reply reservation must pass. Check returns its problems, or none. */
export interface PendingReplyReservationRule {
  check(item: PendingReplyReservation): string[];
}

export class PendingReplyReservationRequiredCodeRule implements PendingReplyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReplyReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReplyReservationRequiredChecksumRule implements PendingReplyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReplyReservation): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReplyReservationRequiredNameRule implements PendingReplyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReplyReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReplyReservationRequiredAudienceIdRule implements PendingReplyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReplyReservation): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReplyReservationCodePrefixRule implements PendingReplyReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingReplyReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingReplyReservationWeightRangeRule implements PendingReplyReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingReplyReservation): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending reply reservation. */
export class PendingReplyReservationValidator {
  rules: PendingReplyReservationRule[];

  constructor(rules: PendingReplyReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PendingReplyReservation): string[] {
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

  requireValid(item: PendingReplyReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingReplyReservation[]): Map<string, string[]> {
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

export function defaultPendingReplyReservationValidator(): PendingReplyReservationValidator {
  return new PendingReplyReservationValidator(
    [
      new PendingReplyReservationRequiredCodeRule("pending reply reservation needs a value"),
      new PendingReplyReservationRequiredChecksumRule("pending reply reservation needs an entry"),
      new PendingReplyReservationRequiredNameRule("pending reply reservation needs a value"),
      new PendingReplyReservationRequiredAudienceIdRule("pending reply reservation needs a value"),
      new PendingReplyReservationCodePrefixRule("Q"),
      new PendingReplyReservationWeightRangeRule(9.3, 3556.6),
    ],
  );
}
