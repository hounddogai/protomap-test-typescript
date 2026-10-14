import { WaitTemplate } from "./wait-template.js";

/** A rule a wait template must pass. Check returns its problems, or none. */
export interface WaitTemplateRule {
  check(item: WaitTemplate): string[];
}

export class WaitTemplateRequiredCodeRule implements WaitTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitTemplateNameLengthRule implements WaitTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitTemplateRequiredTitleRule implements WaitTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitTemplateCodeLengthRule implements WaitTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitTemplateRequiredNameRule implements WaitTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WaitTemplateCostRangeRule implements WaitTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitTemplate): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a wait template. */
export class WaitTemplateValidator {
  rules: WaitTemplateRule[];

  constructor(rules: WaitTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: WaitTemplate): string[] {
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

  requireValid(item: WaitTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitTemplate[]): Map<string, string[]> {
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

export function defaultWaitTemplateValidator(): WaitTemplateValidator {
  return new WaitTemplateValidator(
    [
      new WaitTemplateRequiredCodeRule("wait template needs an entry"),
      new WaitTemplateNameLengthRule(80),
      new WaitTemplateRequiredTitleRule("wait template needs an entry"),
      new WaitTemplateCodeLengthRule(32),
      new WaitTemplateRequiredNameRule("wait template needs an entry"),
      new WaitTemplateCostRangeRule(1, 240.4),
    ],
  );
}
