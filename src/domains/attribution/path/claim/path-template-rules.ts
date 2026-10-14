import { PathTemplate } from "./path-template.js";

/** A rule a path template must pass. Check returns its problems, or none. */
export interface PathTemplateRule {
  check(item: PathTemplate): string[];
}

export class PathTemplateLabelLengthRule implements PathTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathTemplateRequiredLabelRule implements PathTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PathTemplateRequiredPhoneRule implements PathTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathTemplate): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path template. */
export class PathTemplateValidator {
  rules: PathTemplateRule[];

  constructor(rules: PathTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PathTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathTemplate[]): Map<string, string[]> {
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

export function defaultPathTemplateValidator(): PathTemplateValidator {
  return new PathTemplateValidator(
    [
      new PathTemplateLabelLengthRule(32),
      new PathTemplateRequiredLabelRule("path template needs this field"),
      new PathTemplateRequiredPhoneRule("path template needs this field"),
    ],
  );
}
