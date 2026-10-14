import { PayoutTemplate } from "./payout-template.js";

/** A rule a payout template must pass. Check returns its problems, or none. */
export interface PayoutTemplateRule {
  check(item: PayoutTemplate): string[];
}

export class PayoutTemplateRevisionRangeRule implements PayoutTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutTemplate): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PayoutTemplateCodeLengthRule implements PayoutTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutTemplateRequiredOwnerIdRule implements PayoutTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutTemplate): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutTemplateCategoryLengthRule implements PayoutTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutTemplate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutTemplateOwnerIdLengthRule implements PayoutTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutTemplate): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutTemplateRequiredCodeRule implements PayoutTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout template. */
export class PayoutTemplateValidator {
  rules: PayoutTemplateRule[];

  constructor(rules: PayoutTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutTemplate[]): Map<string, string[]> {
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

export function defaultPayoutTemplateValidator(): PayoutTemplateValidator {
  return new PayoutTemplateValidator(
    [
      new PayoutTemplateRevisionRangeRule(120, 120),
      new PayoutTemplateCodeLengthRule(120),
      new PayoutTemplateRequiredOwnerIdRule("payout template needs an entry"),
      new PayoutTemplateCategoryLengthRule(80),
      new PayoutTemplateOwnerIdLengthRule(3600),
      new PayoutTemplateRequiredCodeRule("payout template needs a value"),
    ],
  );
}
