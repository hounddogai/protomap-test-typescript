import * as text from "../../../../kit/text.js";
import { CreditTemplate } from "./credit-template.js";

/** A rule a credit template must pass. Check returns its problems, or none. */
export interface CreditTemplateRule {
  check(item: CreditTemplate): string[];
}

export class CreditTemplateAllowedChannelRule implements CreditTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

export class CreditTemplateRequiredNameRule implements CreditTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreditTemplateRequiredCodeRule implements CreditTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditTemplateRequiredCountryRule implements CreditTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditTemplate): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class CreditTemplateMarginRangeRule implements CreditTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditTemplate): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditTemplateCodePrefixRule implements CreditTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit template. */
export class CreditTemplateValidator {
  rules: CreditTemplateRule[];

  constructor(rules: CreditTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: CreditTemplate): string[] {
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

  requireValid(item: CreditTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditTemplate[]): Map<string, string[]> {
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

export function defaultCreditTemplateValidator(): CreditTemplateValidator {
  return new CreditTemplateValidator(
    [
      new CreditTemplateAllowedChannelRule(["rolling", "batched", "weighted"]),
      new CreditTemplateRequiredNameRule("credit template needs this field"),
      new CreditTemplateRequiredCodeRule("credit template needs an entry"),
      new CreditTemplateRequiredCountryRule("credit template needs a value"),
      new CreditTemplateMarginRangeRule(9.1, 4276.4),
      new CreditTemplateCodePrefixRule("X"),
    ],
  );
}
