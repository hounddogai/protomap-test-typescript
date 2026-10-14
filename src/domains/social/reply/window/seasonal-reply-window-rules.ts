import { SeasonalReplyWindow } from "./seasonal-reply-window.js";

/** A rule a seasonal reply window must pass. Check returns its problems, or none. */
export interface SeasonalReplyWindowRule {
  check(item: SeasonalReplyWindow): string[];
}

export class SeasonalReplyWindowRequiredCodeRule implements SeasonalReplyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReplyWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReplyWindowRequiredAudienceIdRule implements SeasonalReplyWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReplyWindow): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReplyWindowCodePrefixRule implements SeasonalReplyWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalReplyWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalReplyWindowOpenRateRangeRule implements SeasonalReplyWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalReplyWindow): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalReplyWindowVariantLengthRule implements SeasonalReplyWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReplyWindow): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal reply window. */
export class SeasonalReplyWindowValidator {
  rules: SeasonalReplyWindowRule[];

  constructor(rules: SeasonalReplyWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalReplyWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalReplyWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalReplyWindow[]): Map<string, string[]> {
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

export function defaultSeasonalReplyWindowValidator(): SeasonalReplyWindowValidator {
  return new SeasonalReplyWindowValidator(
    [
      new SeasonalReplyWindowRequiredCodeRule("seasonal reply window needs a value"),
      new SeasonalReplyWindowRequiredAudienceIdRule("seasonal reply window needs this field"),
      new SeasonalReplyWindowCodePrefixRule("ACM"),
      new SeasonalReplyWindowOpenRateRangeRule(2.3, 1660.6),
      new SeasonalReplyWindowVariantLengthRule(16),
    ],
  );
}
