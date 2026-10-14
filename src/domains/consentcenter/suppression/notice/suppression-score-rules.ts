import { SuppressionScore } from "./suppression-score.js";

/** A rule a suppression score must pass. Check returns its problems, or none. */
export interface SuppressionScoreRule {
  check(item: SuppressionScore): string[];
}

export class SuppressionScoreRequiredCodeRule implements SuppressionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionScoreSourceLengthRule implements SuppressionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionScore): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionScoreDescriptionLengthRule implements SuppressionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionScore): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionScoreRequiredSourceRule implements SuppressionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionScore): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionScoreCodeLengthRule implements SuppressionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression score. */
export class SuppressionScoreValidator {
  rules: SuppressionScoreRule[];

  constructor(rules: SuppressionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionScore): string[] {
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

  requireValid(item: SuppressionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionScore[]): Map<string, string[]> {
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

export function defaultSuppressionScoreValidator(): SuppressionScoreValidator {
  return new SuppressionScoreValidator(
    [
      new SuppressionScoreRequiredCodeRule("suppression score needs this field"),
      new SuppressionScoreSourceLengthRule(120),
      new SuppressionScoreDescriptionLengthRule(1000),
      new SuppressionScoreRequiredSourceRule("suppression score needs this field"),
      new SuppressionScoreCodeLengthRule(32),
    ],
  );
}
