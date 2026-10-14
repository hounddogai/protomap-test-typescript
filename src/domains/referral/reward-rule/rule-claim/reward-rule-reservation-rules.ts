import { RewardRuleReservation } from "./reward-rule-reservation.js";

/** A rule a reward rule reservation must pass. Check returns its problems, or none. */
export interface RewardRuleReservationRule {
  check(item: RewardRuleReservation): string[];
}

export class RewardRuleReservationCodeLengthRule implements RewardRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleReservationRequiredLabelRule implements RewardRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleReservationLocaleLengthRule implements RewardRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleReservation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleReservationRequiredLocaleRule implements RewardRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleReservationCodePrefixRule implements RewardRuleReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reward rule reservation. */
export class RewardRuleReservationValidator {
  rules: RewardRuleReservationRule[];

  constructor(rules: RewardRuleReservationRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleReservation): string[] {
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

  requireValid(item: RewardRuleReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleReservation[]): Map<string, string[]> {
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

export function defaultRewardRuleReservationValidator(): RewardRuleReservationValidator {
  return new RewardRuleReservationValidator(
    [
      new RewardRuleReservationCodeLengthRule(255),
      new RewardRuleReservationRequiredLabelRule("reward rule reservation needs this field"),
      new RewardRuleReservationLocaleLengthRule(1000),
      new RewardRuleReservationRequiredLocaleRule("reward rule reservation needs an entry"),
      new RewardRuleReservationCodePrefixRule("ACM"),
    ],
  );
}
