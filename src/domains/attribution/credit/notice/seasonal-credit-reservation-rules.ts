import { SeasonalCreditReservation } from "./seasonal-credit-reservation.js";

/** A rule a seasonal credit reservation must pass. Check returns its problems, or none. */
export interface SeasonalCreditReservationRule {
  check(item: SeasonalCreditReservation): string[];
}

export class SeasonalCreditReservationRequiredCodeRule implements SeasonalCreditReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCreditReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCreditReservationChannelLengthRule implements SeasonalCreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCreditReservation): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCreditReservationCodePrefixRule implements SeasonalCreditReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalCreditReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalCreditReservationLabelLengthRule implements SeasonalCreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCreditReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCreditReservationPhoneLengthRule implements SeasonalCreditReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCreditReservation): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal credit reservation. */
export class SeasonalCreditReservationValidator {
  rules: SeasonalCreditReservationRule[];

  constructor(rules: SeasonalCreditReservationRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCreditReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalCreditReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCreditReservation[]): Map<string, string[]> {
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

export function defaultSeasonalCreditReservationValidator(): SeasonalCreditReservationValidator {
  return new SeasonalCreditReservationValidator(
    [
      new SeasonalCreditReservationRequiredCodeRule("seasonal credit reservation needs this field"),
      new SeasonalCreditReservationChannelLengthRule(32),
      new SeasonalCreditReservationCodePrefixRule("OPS"),
      new SeasonalCreditReservationLabelLengthRule(255),
      new SeasonalCreditReservationPhoneLengthRule(255),
    ],
  );
}
