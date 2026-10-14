import { TieredPlacementReservation } from "./tiered-placement-reservation.js";

/** A rule a tiered placement reservation must pass. Check returns its problems, or none. */
export interface TieredPlacementReservationRule {
  check(item: TieredPlacementReservation): string[];
}

export class TieredPlacementReservationRequiredCampaignRefRule implements TieredPlacementReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPlacementReservation): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPlacementReservationArchivedGuardRule implements TieredPlacementReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredPlacementReservation): string[] {
    if (item.archived && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class TieredPlacementReservationCodeLengthRule implements TieredPlacementReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPlacementReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered placement reservation. */
export class TieredPlacementReservationValidator {
  rules: TieredPlacementReservationRule[];

  constructor(rules: TieredPlacementReservationRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPlacementReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPlacementReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPlacementReservation[]): Map<string, string[]> {
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

export function defaultTieredPlacementReservationValidator(): TieredPlacementReservationValidator {
  return new TieredPlacementReservationValidator(
    [
      new TieredPlacementReservationRequiredCampaignRefRule("tiered placement reservation needs an entry"),
      new TieredPlacementReservationArchivedGuardRule(7.2),
      new TieredPlacementReservationCodeLengthRule(255),
    ],
  );
}
