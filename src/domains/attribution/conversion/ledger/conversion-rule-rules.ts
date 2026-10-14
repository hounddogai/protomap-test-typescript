import * as text from "../../../../kit/text.js";
import { ConversionRule } from "./conversion-rule.js";

/** A rule a conversion rule must pass. Check returns its problems, or none. */
export interface ConversionRuleRule {
  check(item: ConversionRule): string[];
}

export class ConversionRuleRequiredExternalRefRule implements ConversionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionRule): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionRuleAllowedNameRule implements ConversionRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class ConversionRuleCodePrefixRule implements ConversionRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionRuleNameLengthRule implements ConversionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionRuleExternalRefLengthRule implements ConversionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionRule): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion rule. */
export class ConversionRuleValidator {
  rules: ConversionRuleRule[];

  constructor(rules: ConversionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionRule): string[] {
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

  requireValid(item: ConversionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionRule[]): Map<string, string[]> {
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

export function defaultConversionRuleValidator(): ConversionRuleValidator {
  return new ConversionRuleValidator(
    [
      new ConversionRuleRequiredExternalRefRule("conversion rule needs a value"),
      new ConversionRuleAllowedNameRule([]),
      new ConversionRuleCodePrefixRule("Q"),
      new ConversionRuleNameLengthRule(16),
      new ConversionRuleExternalRefLengthRule(64),
    ],
  );
}
