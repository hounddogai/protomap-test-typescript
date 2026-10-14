import { SeasonalActivationWindow } from "./seasonal-activation-window.js";

/** A rule a seasonal activation window must pass. Check returns its problems, or none. */
export interface SeasonalActivationWindowRule {
  check(item: SeasonalActivationWindow): string[];
}

export class SeasonalActivationWindowSequenceRangeRule implements SeasonalActivationWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalActivationWindow): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalActivationWindowCodeLengthRule implements SeasonalActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalActivationWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalActivationWindowRequiredNameRule implements SeasonalActivationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalActivationWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalActivationWindowNameLengthRule implements SeasonalActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalActivationWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalActivationWindowTitleLengthRule implements SeasonalActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalActivationWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal activation window. */
export class SeasonalActivationWindowValidator {
  rules: SeasonalActivationWindowRule[];

  constructor(rules: SeasonalActivationWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalActivationWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalActivationWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalActivationWindow[]): Map<string, string[]> {
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

export function defaultSeasonalActivationWindowValidator(): SeasonalActivationWindowValidator {
  return new SeasonalActivationWindowValidator(
    [
      new SeasonalActivationWindowSequenceRangeRule(32, 120),
      new SeasonalActivationWindowCodeLengthRule(80),
      new SeasonalActivationWindowRequiredNameRule("seasonal activation window needs an entry"),
      new SeasonalActivationWindowNameLengthRule(3600),
      new SeasonalActivationWindowTitleLengthRule(120),
    ],
  );
}
