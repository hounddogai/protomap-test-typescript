import { GlobalLevelThreshold } from "./global-level-threshold.js";

/** A rule a global level threshold must pass. Check returns its problems, or none. */
export interface GlobalLevelThresholdRule {
  check(item: GlobalLevelThreshold): string[];
}

export class GlobalLevelThresholdRequiredDescriptionRule implements GlobalLevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalLevelThreshold): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalLevelThresholdRequiredTitleRule implements GlobalLevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalLevelThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalLevelThresholdDescriptionLengthRule implements GlobalLevelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalLevelThreshold): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global level threshold. */
export class GlobalLevelThresholdValidator {
  rules: GlobalLevelThresholdRule[];

  constructor(rules: GlobalLevelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalLevelThreshold): string[] {
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

  requireValid(item: GlobalLevelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalLevelThreshold[]): Map<string, string[]> {
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

export function defaultGlobalLevelThresholdValidator(): GlobalLevelThresholdValidator {
  return new GlobalLevelThresholdValidator(
    [
      new GlobalLevelThresholdRequiredDescriptionRule("global level threshold needs an entry"),
      new GlobalLevelThresholdRequiredTitleRule("global level threshold needs this field"),
      new GlobalLevelThresholdDescriptionLengthRule(1000),
    ],
  );
}
