import { FallbackInsightDraft } from "./fallback-insight-draft.js";

/** A rule a fallback insight draft must pass. Check returns its problems, or none. */
export interface FallbackInsightDraftRule {
  check(item: FallbackInsightDraft): string[];
}

export class FallbackInsightDraftSendAtRangeRule implements FallbackInsightDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackInsightDraft): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackInsightDraftRequiredCodeRule implements FallbackInsightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightDraftAudienceIdLengthRule implements FallbackInsightDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInsightDraft): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackInsightDraftConversionRateRangeRule implements FallbackInsightDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackInsightDraft): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackInsightDraftRequiredLabelRule implements FallbackInsightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback insight draft. */
export class FallbackInsightDraftValidator {
  rules: FallbackInsightDraftRule[];

  constructor(rules: FallbackInsightDraftRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInsightDraft): string[] {
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

  requireValid(item: FallbackInsightDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInsightDraft[]): Map<string, string[]> {
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

export function defaultFallbackInsightDraftValidator(): FallbackInsightDraftValidator {
  return new FallbackInsightDraftValidator(
    [
      new FallbackInsightDraftSendAtRangeRule(255, 86400),
      new FallbackInsightDraftRequiredCodeRule("fallback insight draft needs this field"),
      new FallbackInsightDraftAudienceIdLengthRule(86400),
      new FallbackInsightDraftConversionRateRangeRule(6.8, 2915),
      new FallbackInsightDraftRequiredLabelRule("fallback insight draft needs this field"),
    ],
  );
}
