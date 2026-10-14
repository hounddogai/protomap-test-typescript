import { WindowDraft } from "./window-draft.js";

/** A rule a window draft must pass. Check returns its problems, or none. */
export interface WindowDraftRule {
  check(item: WindowDraft): string[];
}

export class WindowDraftConversionRateRangeRule implements WindowDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowDraft): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowDraftRequiredCampaignRefRule implements WindowDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowDraft): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WindowDraftSendAtRangeRule implements WindowDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowDraft): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a window draft. */
export class WindowDraftValidator {
  rules: WindowDraftRule[];

  constructor(rules: WindowDraftRule[]) {
    this.rules = rules;
  }

  validate(item: WindowDraft): string[] {
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

  requireValid(item: WindowDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowDraft[]): Map<string, string[]> {
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

export function defaultWindowDraftValidator(): WindowDraftValidator {
  return new WindowDraftValidator(
    [
      new WindowDraftConversionRateRangeRule(8, 205.9),
      new WindowDraftRequiredCampaignRefRule("window draft needs this field"),
      new WindowDraftSendAtRangeRule(32, 86400),
    ],
  );
}
