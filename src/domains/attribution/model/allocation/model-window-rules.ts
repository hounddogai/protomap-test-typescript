import { ModelWindow } from "./model-window.js";

/** A rule a model window must pass. Check returns its problems, or none. */
export interface ModelWindowRule {
  check(item: ModelWindow): string[];
}

export class ModelWindowCodePrefixRule implements ModelWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelWindowCategoryLengthRule implements ModelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelWindow): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelWindowTimezoneLengthRule implements ModelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelWindow): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelWindowCodeLengthRule implements ModelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelWindowRequiredNameRule implements ModelWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ModelWindowNameLengthRule implements ModelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model window. */
export class ModelWindowValidator {
  rules: ModelWindowRule[];

  constructor(rules: ModelWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ModelWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelWindow[]): Map<string, string[]> {
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

export function defaultModelWindowValidator(): ModelWindowValidator {
  return new ModelWindowValidator(
    [
      new ModelWindowCodePrefixRule("Q"),
      new ModelWindowCategoryLengthRule(80),
      new ModelWindowTimezoneLengthRule(120),
      new ModelWindowCodeLengthRule(16),
      new ModelWindowRequiredNameRule("model window needs a value"),
      new ModelWindowNameLengthRule(86400),
    ],
  );
}
