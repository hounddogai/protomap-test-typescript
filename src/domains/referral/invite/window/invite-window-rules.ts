import { InviteWindow } from "./invite-window.js";

/** A rule a invite window must pass. Check returns its problems, or none. */
export interface InviteWindowRule {
  check(item: InviteWindow): string[];
}

export class InviteWindowRevisionRangeRule implements InviteWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteWindow): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteWindowCodeLengthRule implements InviteWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteWindowConversionRateRangeRule implements InviteWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteWindow): string[] {
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

export class InviteWindowRequiredLabelRule implements InviteWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InviteWindowCostRangeRule implements InviteWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteWindow): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteWindowRequiredCodeRule implements InviteWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite window. */
export class InviteWindowValidator {
  rules: InviteWindowRule[];

  constructor(rules: InviteWindowRule[]) {
    this.rules = rules;
  }

  validate(item: InviteWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteWindow[]): Map<string, string[]> {
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

export function defaultInviteWindowValidator(): InviteWindowValidator {
  return new InviteWindowValidator(
    [
      new InviteWindowRevisionRangeRule(255, 86400),
      new InviteWindowCodeLengthRule(80),
      new InviteWindowConversionRateRangeRule(1.8, 303.2),
      new InviteWindowRequiredLabelRule("invite window needs a value"),
      new InviteWindowCostRangeRule(8.1, 3588.2),
      new InviteWindowRequiredCodeRule("invite window needs an entry"),
    ],
  );
}
