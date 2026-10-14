import { AdaptivePlacementTemplate } from "./adaptive-placement-template.js";

/** A rule a adaptive placement template must pass. Check returns its problems, or none. */
export interface AdaptivePlacementTemplateRule {
  check(item: AdaptivePlacementTemplate): string[];
}

export class AdaptivePlacementTemplateCodeLengthRule implements AdaptivePlacementTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePlacementTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePlacementTemplateRequiredNameRule implements AdaptivePlacementTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePlacementTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePlacementTemplateScoreRangeRule implements AdaptivePlacementTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementTemplate): string[] {
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

/** Runs every rule of a adaptive placement template. */
export class AdaptivePlacementTemplateValidator {
  rules: AdaptivePlacementTemplateRule[];

  constructor(rules: AdaptivePlacementTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePlacementTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePlacementTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePlacementTemplate[]): Map<string, string[]> {
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

export function defaultAdaptivePlacementTemplateValidator(): AdaptivePlacementTemplateValidator {
  return new AdaptivePlacementTemplateValidator(
    [
      new AdaptivePlacementTemplateCodeLengthRule(120),
      new AdaptivePlacementTemplateRequiredNameRule("adaptive placement template needs a value"),
      new AdaptivePlacementTemplateScoreRangeRule(4.3, 697.6),
    ],
  );
}
