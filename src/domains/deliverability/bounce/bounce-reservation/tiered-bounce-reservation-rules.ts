import { TieredBounceReservation } from "./tiered-bounce-reservation.js";

/** A rule a tiered bounce reservation must pass. Check returns its problems, or none. */
export interface TieredBounceReservationRule {
  check(item: TieredBounceReservation): string[];
}

export class TieredBounceReservationRequiredLabelRule implements TieredBounceReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceReservationCodePrefixRule implements TieredBounceReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredBounceReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredBounceReservationCapacityRangeRule implements TieredBounceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceReservation): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBounceReservationRateRangeRule implements TieredBounceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceReservation): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredBounceReservationPinnedGuardRule implements TieredBounceReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredBounceReservation): string[] {
    if (item.pinned && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TieredBounceReservationScoreRangeRule implements TieredBounceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceReservation): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered bounce reservation. */
export class TieredBounceReservationValidator {
  rules: TieredBounceReservationRule[];

  constructor(rules: TieredBounceReservationRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBounceReservation): string[] {
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

  requireValid(item: TieredBounceReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBounceReservation[]): Map<string, string[]> {
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

export function defaultTieredBounceReservationValidator(): TieredBounceReservationValidator {
  return new TieredBounceReservationValidator(
    [
      new TieredBounceReservationRequiredLabelRule("tiered bounce reservation needs an entry"),
      new TieredBounceReservationCodePrefixRule("Q"),
      new TieredBounceReservationCapacityRangeRule(16, 3600),
      new TieredBounceReservationRateRangeRule(5.2, 1762.6),
      new TieredBounceReservationPinnedGuardRule(255),
      new TieredBounceReservationScoreRangeRule(0.4, 4856.3),
    ],
  );
}
