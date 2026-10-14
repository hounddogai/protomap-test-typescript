import { LenientDomainTemplate } from "./lenient-domain-template.js";

/** A rule a lenient domain template must pass. Check returns its problems, or none. */
export interface LenientDomainTemplateRule {
  check(item: LenientDomainTemplate): string[];
}

export class LenientDomainTemplateRequiredUtmSourceRule implements LenientDomainTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDomainTemplate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDomainTemplateOpenRateRangeRule implements LenientDomainTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientDomainTemplate): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientDomainTemplateTitleLengthRule implements LenientDomainTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDomainTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient domain template. */
export class LenientDomainTemplateValidator {
  rules: LenientDomainTemplateRule[];

  constructor(rules: LenientDomainTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDomainTemplate): string[] {
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

  requireValid(item: LenientDomainTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDomainTemplate[]): Map<string, string[]> {
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

export function defaultLenientDomainTemplateValidator(): LenientDomainTemplateValidator {
  return new LenientDomainTemplateValidator(
    [
      new LenientDomainTemplateRequiredUtmSourceRule("lenient domain template needs this field"),
      new LenientDomainTemplateOpenRateRangeRule(2.1, 1658.2),
      new LenientDomainTemplateTitleLengthRule(3600),
    ],
  );
}
