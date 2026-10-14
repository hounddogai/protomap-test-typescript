import { BatchedWarmupReservation } from "./batched-warmup-reservation.js";

/** A rule a batched warmup reservation must pass. Check returns its problems, or none. */
export interface BatchedWarmupReservationRule {
  check(item: BatchedWarmupReservation): string[];
}

export class BatchedWarmupReservationCodeLengthRule implements BatchedWarmupReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWarmupReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWarmupReservationRequiredUnitRule implements BatchedWarmupReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWarmupReservation): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWarmupReservationCodePrefixRule implements BatchedWarmupReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedWarmupReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedWarmupReservationRequiredCampaignRefRule implements BatchedWarmupReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWarmupReservation): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWarmupReservationExpiresAtRangeRule implements BatchedWarmupReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWarmupReservation): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched warmup reservation. */
export class BatchedWarmupReservationValidator {
  rules: BatchedWarmupReservationRule[];

  constructor(rules: BatchedWarmupReservationRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWarmupReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedWarmupReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWarmupReservation[]): Map<string, string[]> {
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

export function defaultBatchedWarmupReservationValidator(): BatchedWarmupReservationValidator {
  return new BatchedWarmupReservationValidator(
    [
      new BatchedWarmupReservationCodeLengthRule(86400),
      new BatchedWarmupReservationRequiredUnitRule("batched warmup reservation needs an entry"),
      new BatchedWarmupReservationCodePrefixRule("REF"),
      new BatchedWarmupReservationRequiredCampaignRefRule("batched warmup reservation needs this field"),
      new BatchedWarmupReservationExpiresAtRangeRule(3600, 3600),
    ],
  );
}
