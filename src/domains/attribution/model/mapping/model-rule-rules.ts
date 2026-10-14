import { ModelRule } from "./model-rule.js";

/** A rule a model rule must pass. Check returns its problems, or none. */
export interface ModelRuleRule {
  check(item: ModelRule): string[];
}

export class ModelRuleRequiredNameRule implements ModelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ModelRuleCodeLengthRule implements ModelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelRuleRequiredAudienceIdRule implements ModelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelRule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ModelRuleRequiredJourneyIdRule implements ModelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelRule): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ModelRuleScoreRangeRule implements ModelRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelRule): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a model rule. */
export class ModelRuleValidator {
  rules: ModelRuleRule[];

  constructor(rules: ModelRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ModelRule): string[] {
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

  requireValid(item: ModelRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelRule[]): Map<string, string[]> {
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

export function defaultModelRuleValidator(): ModelRuleValidator {
  return new ModelRuleValidator(
    [
      new ModelRuleRequiredNameRule("model rule needs an entry"),
      new ModelRuleCodeLengthRule(1000),
      new ModelRuleRequiredAudienceIdRule("model rule needs an entry"),
      new ModelRuleRequiredJourneyIdRule("model rule needs an entry"),
      new ModelRuleScoreRangeRule(6.5, 2347.8),
    ],
  );
}
