import { WarmupTemplate } from "./warmup-template.js";

/** A rule a warmup template must pass. Check returns its problems, or none. */
export interface WarmupTemplateRule {
  check(item: WarmupTemplate): string[];
}

export class WarmupTemplateNameLengthRule implements WarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupTemplateRequiredNameRule implements WarmupTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupTemplateCodeLengthRule implements WarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup template. */
export class WarmupTemplateValidator {
  rules: WarmupTemplateRule[];

  constructor(rules: WarmupTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupTemplate[]): Map<string, string[]> {
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

export function defaultWarmupTemplateValidator(): WarmupTemplateValidator {
  return new WarmupTemplateValidator(
    [
      new WarmupTemplateNameLengthRule(16),
      new WarmupTemplateRequiredNameRule("warmup template needs this field"),
      new WarmupTemplateCodeLengthRule(16),
    ],
  );
}
