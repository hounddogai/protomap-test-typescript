import { BadgeDraft } from "./badge-draft.js";

/** A rule a badge draft must pass. Check returns its problems, or none. */
export interface BadgeDraftRule {
  check(item: BadgeDraft): string[];
}

export class BadgeDraftExpiresAtRangeRule implements BadgeDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeDraft): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeDraftWeightRangeRule implements BadgeDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeDraft): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeDraftRequiredCodeRule implements BadgeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeDraftRequiredTitleRule implements BadgeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge draft. */
export class BadgeDraftValidator {
  rules: BadgeDraftRule[];

  constructor(rules: BadgeDraftRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeDraft[]): Map<string, string[]> {
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

export function defaultBadgeDraftValidator(): BadgeDraftValidator {
  return new BadgeDraftValidator(
    [
      new BadgeDraftExpiresAtRangeRule(3600, 3600),
      new BadgeDraftWeightRangeRule(7.9, 2443.6),
      new BadgeDraftRequiredCodeRule("badge draft needs a value"),
      new BadgeDraftRequiredTitleRule("badge draft needs an entry"),
    ],
  );
}
