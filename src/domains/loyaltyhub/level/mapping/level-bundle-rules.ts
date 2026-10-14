import { LevelBundle } from "./level-bundle.js";

/** A rule a level bundle must pass. Check returns its problems, or none. */
export interface LevelBundleRule {
  check(item: LevelBundle): string[];
}

export class LevelBundleRequiredSourceRule implements LevelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelBundle): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LevelBundleRequiredTitleRule implements LevelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LevelBundleTitleLengthRule implements LevelBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelBundleCodeLengthRule implements LevelBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelBundleRequiredUnitRule implements LevelBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelBundle): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level bundle. */
export class LevelBundleValidator {
  rules: LevelBundleRule[];

  constructor(rules: LevelBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LevelBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelBundle[]): Map<string, string[]> {
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

export function defaultLevelBundleValidator(): LevelBundleValidator {
  return new LevelBundleValidator(
    [
      new LevelBundleRequiredSourceRule("level bundle needs this field"),
      new LevelBundleRequiredTitleRule("level bundle needs a value"),
      new LevelBundleTitleLengthRule(255),
      new LevelBundleCodeLengthRule(120),
      new LevelBundleRequiredUnitRule("level bundle needs an entry"),
    ],
  );
}
