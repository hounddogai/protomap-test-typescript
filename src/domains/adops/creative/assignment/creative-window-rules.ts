import { CreativeWindow } from "./creative-window.js";

/** A rule a creative window must pass. Check returns its problems, or none. */
export interface CreativeWindowRule {
  check(item: CreativeWindow): string[];
}

export class CreativeWindowCodeLengthRule implements CreativeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeWindowRequiredLocaleRule implements CreativeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeWindow): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeWindowRequiredOwnerIdRule implements CreativeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeWindow): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeWindowRateRangeRule implements CreativeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeWindow): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeWindowRequiredCodeRule implements CreativeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative window. */
export class CreativeWindowValidator {
  rules: CreativeWindowRule[];

  constructor(rules: CreativeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeWindow): string[] {
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

  requireValid(item: CreativeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeWindow[]): Map<string, string[]> {
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

export function defaultCreativeWindowValidator(): CreativeWindowValidator {
  return new CreativeWindowValidator(
    [
      new CreativeWindowCodeLengthRule(32),
      new CreativeWindowRequiredLocaleRule("creative window needs a value"),
      new CreativeWindowRequiredOwnerIdRule("creative window needs this field"),
      new CreativeWindowRateRangeRule(8.7, 1137.8),
      new CreativeWindowRequiredCodeRule("creative window needs this field"),
    ],
  );
}
