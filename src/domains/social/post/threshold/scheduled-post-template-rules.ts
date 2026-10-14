import { ScheduledPostTemplate } from "./scheduled-post-template.js";

/** A rule a scheduled post template must pass. Check returns its problems, or none. */
export interface ScheduledPostTemplateRule {
  check(item: ScheduledPostTemplate): string[];
}

export class ScheduledPostTemplateRequiredLabelRule implements ScheduledPostTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPostTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPostTemplateRequiredCodeRule implements ScheduledPostTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPostTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPostTemplateRequiredSegmentRule implements ScheduledPostTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPostTemplate): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPostTemplateLabelLengthRule implements ScheduledPostTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPostTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled post template. */
export class ScheduledPostTemplateValidator {
  rules: ScheduledPostTemplateRule[];

  constructor(rules: ScheduledPostTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPostTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPostTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPostTemplate[]): Map<string, string[]> {
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

export function defaultScheduledPostTemplateValidator(): ScheduledPostTemplateValidator {
  return new ScheduledPostTemplateValidator(
    [
      new ScheduledPostTemplateRequiredLabelRule("scheduled post template needs this field"),
      new ScheduledPostTemplateRequiredCodeRule("scheduled post template needs an entry"),
      new ScheduledPostTemplateRequiredSegmentRule("scheduled post template needs a value"),
      new ScheduledPostTemplateLabelLengthRule(32),
    ],
  );
}
