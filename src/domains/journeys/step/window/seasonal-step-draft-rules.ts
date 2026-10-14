import * as text from "../../../../kit/text.js";
import { SeasonalStepDraft } from "./seasonal-step-draft.js";

/** A rule a seasonal step draft must pass. Check returns its problems, or none. */
export interface SeasonalStepDraftRule {
  check(item: SeasonalStepDraft): string[];
}

export class SeasonalStepDraftJourneyIdLengthRule implements SeasonalStepDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalStepDraft): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalStepDraftNameLengthRule implements SeasonalStepDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalStepDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalStepDraftCapacityRangeRule implements SeasonalStepDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalStepDraft): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalStepDraftRequiredCodeRule implements SeasonalStepDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalStepDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalStepDraftAllowedNameRule implements SeasonalStepDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalStepDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

/** Runs every rule of a seasonal step draft. */
export class SeasonalStepDraftValidator {
  rules: SeasonalStepDraftRule[];

  constructor(rules: SeasonalStepDraftRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalStepDraft): string[] {
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

  requireValid(item: SeasonalStepDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalStepDraft[]): Map<string, string[]> {
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

export function defaultSeasonalStepDraftValidator(): SeasonalStepDraftValidator {
  return new SeasonalStepDraftValidator(
    [
      new SeasonalStepDraftJourneyIdLengthRule(1000),
      new SeasonalStepDraftNameLengthRule(3600),
      new SeasonalStepDraftCapacityRangeRule(255, 86400),
      new SeasonalStepDraftRequiredCodeRule("seasonal step draft needs a value"),
      new SeasonalStepDraftAllowedNameRule([]),
    ],
  );
}
