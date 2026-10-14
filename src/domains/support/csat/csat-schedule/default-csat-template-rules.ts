import { DefaultCsatTemplate } from "./default-csat-template.js";

/** A rule a default csat template must pass. Check returns its problems, or none. */
export interface DefaultCsatTemplateRule {
  check(item: DefaultCsatTemplate): string[];
}

export class DefaultCsatTemplateRequiredNameRule implements DefaultCsatTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCsatTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCsatTemplateCodeLengthRule implements DefaultCsatTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCsatTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultCsatTemplateNameLengthRule implements DefaultCsatTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCsatTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default csat template. */
export class DefaultCsatTemplateValidator {
  rules: DefaultCsatTemplateRule[];

  constructor(rules: DefaultCsatTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCsatTemplate): string[] {
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

  requireValid(item: DefaultCsatTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCsatTemplate[]): Map<string, string[]> {
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

export function defaultDefaultCsatTemplateValidator(): DefaultCsatTemplateValidator {
  return new DefaultCsatTemplateValidator(
    [
      new DefaultCsatTemplateRequiredNameRule("default csat template needs a value"),
      new DefaultCsatTemplateCodeLengthRule(32),
      new DefaultCsatTemplateNameLengthRule(16),
    ],
  );
}
