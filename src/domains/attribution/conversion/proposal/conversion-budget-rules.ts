import { ConversionBudget } from "./conversion-budget.js";

/** A rule a conversion budget must pass. Check returns its problems, or none. */
export interface ConversionBudgetRule {
  check(item: ConversionBudget): string[];
}

export class ConversionBudgetNameLengthRule implements ConversionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionBudgetCodePrefixRule implements ConversionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionBudgetRequiredLabelRule implements ConversionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionBudgetRequiredNameRule implements ConversionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionBudgetCodeLengthRule implements ConversionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion budget. */
export class ConversionBudgetValidator {
  rules: ConversionBudgetRule[];

  constructor(rules: ConversionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionBudget[]): Map<string, string[]> {
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

export function defaultConversionBudgetValidator(): ConversionBudgetValidator {
  return new ConversionBudgetValidator(
    [
      new ConversionBudgetNameLengthRule(120),
      new ConversionBudgetCodePrefixRule("ACM"),
      new ConversionBudgetRequiredLabelRule("conversion budget needs an entry"),
      new ConversionBudgetRequiredNameRule("conversion budget needs an entry"),
      new ConversionBudgetCodeLengthRule(86400),
    ],
  );
}
