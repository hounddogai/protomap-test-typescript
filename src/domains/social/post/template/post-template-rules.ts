import { PostTemplate } from "./post-template.js";

/** A rule a post template must pass. Check returns its problems, or none. */
export interface PostTemplateRule {
  check(item: PostTemplate): string[];
}

export class PostTemplateVariantLengthRule implements PostTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostTemplate): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostTemplateSummaryLengthRule implements PostTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostTemplate): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostTemplateRequiredVariantRule implements PostTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostTemplate): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post template. */
export class PostTemplateValidator {
  rules: PostTemplateRule[];

  constructor(rules: PostTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PostTemplate): string[] {
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

  requireValid(item: PostTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostTemplate[]): Map<string, string[]> {
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

export function defaultPostTemplateValidator(): PostTemplateValidator {
  return new PostTemplateValidator(
    [
      new PostTemplateVariantLengthRule(64),
      new PostTemplateSummaryLengthRule(1000),
      new PostTemplateRequiredVariantRule("post template needs an entry"),
    ],
  );
}
