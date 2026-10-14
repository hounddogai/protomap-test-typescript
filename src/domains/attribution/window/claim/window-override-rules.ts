import { WindowOverride } from "./window-override.js";

/** A rule a window override must pass. Check returns its problems, or none. */
export interface WindowOverrideRule {
  check(item: WindowOverride): string[];
}

export class WindowOverrideJourneyIdLengthRule implements WindowOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowOverride): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowOverrideTitleLengthRule implements WindowOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowOverrideRequiredCampaignRefRule implements WindowOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowOverride): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WindowOverrideUpdatedAtRangeRule implements WindowOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowOverride): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a window override. */
export class WindowOverrideValidator {
  rules: WindowOverrideRule[];

  constructor(rules: WindowOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: WindowOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowOverride[]): Map<string, string[]> {
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

export function defaultWindowOverrideValidator(): WindowOverrideValidator {
  return new WindowOverrideValidator(
    [
      new WindowOverrideJourneyIdLengthRule(1000),
      new WindowOverrideTitleLengthRule(32),
      new WindowOverrideRequiredCampaignRefRule("window override needs a value"),
      new WindowOverrideUpdatedAtRangeRule(120, 255),
    ],
  );
}
