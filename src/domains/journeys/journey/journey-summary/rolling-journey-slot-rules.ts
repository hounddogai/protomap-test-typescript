import { RollingJourneySlot } from "./rolling-journey-slot.js";

/** A rule a rolling journey slot must pass. Check returns its problems, or none. */
export interface RollingJourneySlotRule {
  check(item: RollingJourneySlot): string[];
}

export class RollingJourneySlotCostRangeRule implements RollingJourneySlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneySlot): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingJourneySlotRequiredCampaignRefRule implements RollingJourneySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneySlot): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneySlotJourneyIdLengthRule implements RollingJourneySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneySlot): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling journey slot. */
export class RollingJourneySlotValidator {
  rules: RollingJourneySlotRule[];

  constructor(rules: RollingJourneySlotRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneySlot): string[] {
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

  requireValid(item: RollingJourneySlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneySlot[]): Map<string, string[]> {
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

export function defaultRollingJourneySlotValidator(): RollingJourneySlotValidator {
  return new RollingJourneySlotValidator(
    [
      new RollingJourneySlotCostRangeRule(0.2, 1798.6),
      new RollingJourneySlotRequiredCampaignRefRule("rolling journey slot needs this field"),
      new RollingJourneySlotJourneyIdLengthRule(3600),
    ],
  );
}
