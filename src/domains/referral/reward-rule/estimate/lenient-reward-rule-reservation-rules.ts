import { LenientRewardRuleReservation } from "./lenient-reward-rule-reservation.js";

/** A rule a lenient reward rule reservation must pass. Check returns its problems, or none. */
export interface LenientRewardRuleReservationRule {
  check(item: LenientRewardRuleReservation): string[];
}

export class LenientRewardRuleReservationPhoneLengthRule implements LenientRewardRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardRuleReservation): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardRuleReservationNotesLengthRule implements LenientRewardRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardRuleReservation): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardRuleReservationRequiredNameRule implements LenientRewardRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRewardRuleReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient reward rule reservation. */
export class LenientRewardRuleReservationValidator {
  rules: LenientRewardRuleReservationRule[];

  constructor(rules: LenientRewardRuleReservationRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardRuleReservation): string[] {
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

  requireValid(item: LenientRewardRuleReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardRuleReservation[]): Map<string, string[]> {
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

export function defaultLenientRewardRuleReservationValidator(): LenientRewardRuleReservationValidator {
  return new LenientRewardRuleReservationValidator(
    [
      new LenientRewardRuleReservationPhoneLengthRule(120),
      new LenientRewardRuleReservationNotesLengthRule(32),
      new LenientRewardRuleReservationRequiredNameRule("lenient reward rule reservation needs a value"),
    ],
  );
}
