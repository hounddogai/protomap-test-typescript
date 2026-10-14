import { ChallengeTemplate } from "./challenge-template.js";

/** A rule a challenge template must pass. Check returns its problems, or none. */
export interface ChallengeTemplateRule {
  check(item: ChallengeTemplate): string[];
}

export class ChallengeTemplateCodeLengthRule implements ChallengeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeTemplateAmountRangeRule implements ChallengeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeTemplate): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeTemplateCategoryLengthRule implements ChallengeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeTemplate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeTemplateRequiredCodeRule implements ChallengeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge template. */
export class ChallengeTemplateValidator {
  rules: ChallengeTemplateRule[];

  constructor(rules: ChallengeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeTemplate[]): Map<string, string[]> {
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

export function defaultChallengeTemplateValidator(): ChallengeTemplateValidator {
  return new ChallengeTemplateValidator(
    [
      new ChallengeTemplateCodeLengthRule(80),
      new ChallengeTemplateAmountRangeRule(9, 1608.1),
      new ChallengeTemplateCategoryLengthRule(1000),
      new ChallengeTemplateRequiredCodeRule("challenge template needs a value"),
    ],
  );
}
