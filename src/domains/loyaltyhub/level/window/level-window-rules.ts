import { LevelWindow } from "./level-window.js";

/** A rule a level window must pass. Check returns its problems, or none. */
export interface LevelWindowRule {
  check(item: LevelWindow): string[];
}

export class LevelWindowReviewerLengthRule implements LevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelWindow): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelWindowUnitLengthRule implements LevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelWindow): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelWindowNameLengthRule implements LevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelWindowCodeLengthRule implements LevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelWindowRequiredUnitRule implements LevelWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelWindow): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level window. */
export class LevelWindowValidator {
  rules: LevelWindowRule[];

  constructor(rules: LevelWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LevelWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelWindow[]): Map<string, string[]> {
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

export function defaultLevelWindowValidator(): LevelWindowValidator {
  return new LevelWindowValidator(
    [
      new LevelWindowReviewerLengthRule(120),
      new LevelWindowUnitLengthRule(86400),
      new LevelWindowNameLengthRule(3600),
      new LevelWindowCodeLengthRule(120),
      new LevelWindowRequiredUnitRule("level window needs this field"),
    ],
  );
}
