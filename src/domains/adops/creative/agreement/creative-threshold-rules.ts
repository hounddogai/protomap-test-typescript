import { CreativeThreshold } from "./creative-threshold.js";

/** A rule a creative threshold must pass. Check returns its problems, or none. */
export interface CreativeThresholdRule {
  check(item: CreativeThreshold): string[];
}

export class CreativeThresholdLocaleLengthRule implements CreativeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeThreshold): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeThresholdVisibleGuardRule implements CreativeThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreativeThreshold): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CreativeThresholdRequiredTitleRule implements CreativeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeThresholdQuantityRangeRule implements CreativeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeThreshold): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a creative threshold. */
export class CreativeThresholdValidator {
  rules: CreativeThresholdRule[];

  constructor(rules: CreativeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeThreshold[]): Map<string, string[]> {
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

export function defaultCreativeThresholdValidator(): CreativeThresholdValidator {
  return new CreativeThresholdValidator(
    [
      new CreativeThresholdLocaleLengthRule(86400),
      new CreativeThresholdVisibleGuardRule(86400),
      new CreativeThresholdRequiredTitleRule("creative threshold needs a value"),
      new CreativeThresholdQuantityRangeRule(80, 3600),
    ],
  );
}
