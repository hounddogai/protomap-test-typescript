import { SeasonalQueueReservation } from "./seasonal-queue-reservation.js";

/** A rule a seasonal queue reservation must pass. Check returns its problems, or none. */
export interface SeasonalQueueReservationRule {
  check(item: SeasonalQueueReservation): string[];
}

export class SeasonalQueueReservationRequiredLabelRule implements SeasonalQueueReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalQueueReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalQueueReservationScoreRangeRule implements SeasonalQueueReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalQueueReservation): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalQueueReservationApprovedGuardRule implements SeasonalQueueReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalQueueReservation): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a seasonal queue reservation. */
export class SeasonalQueueReservationValidator {
  rules: SeasonalQueueReservationRule[];

  constructor(rules: SeasonalQueueReservationRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalQueueReservation): string[] {
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

  requireValid(item: SeasonalQueueReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalQueueReservation[]): Map<string, string[]> {
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

export function defaultSeasonalQueueReservationValidator(): SeasonalQueueReservationValidator {
  return new SeasonalQueueReservationValidator(
    [
      new SeasonalQueueReservationRequiredLabelRule("seasonal queue reservation needs this field"),
      new SeasonalQueueReservationScoreRangeRule(6.5, 3982.2),
      new SeasonalQueueReservationApprovedGuardRule(3.7),
    ],
  );
}
