import * as text from "../../../../kit/text.js";
import { SuppressionRequest } from "./suppression-request.js";

/** A rule a suppression request must pass. Check returns its problems, or none. */
export interface SuppressionRequestRule {
  check(item: SuppressionRequest): string[];
}

export class SuppressionRequestFloorValueRangeRule implements SuppressionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionRequest): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionRequestAllowedJourneyIdRule implements SuppressionRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is unknown`];
    return [];
  }
}

export class SuppressionRequestRequiredLabelRule implements SuppressionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression request. */
export class SuppressionRequestValidator {
  rules: SuppressionRequestRule[];

  constructor(rules: SuppressionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionRequest): string[] {
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

  requireValid(item: SuppressionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionRequest[]): Map<string, string[]> {
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

export function defaultSuppressionRequestValidator(): SuppressionRequestValidator {
  return new SuppressionRequestValidator(
    [
      new SuppressionRequestFloorValueRangeRule(5.1, 3898.8),
      new SuppressionRequestAllowedJourneyIdRule(["tiered"]),
      new SuppressionRequestRequiredLabelRule("suppression request needs an entry"),
    ],
  );
}
