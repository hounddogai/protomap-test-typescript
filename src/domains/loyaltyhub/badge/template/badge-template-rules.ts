import { BadgeTemplate } from "./badge-template.js";

/** A rule a badge template must pass. Check returns its problems, or none. */
export interface BadgeTemplateRule {
  check(item: BadgeTemplate): string[];
}

export class BadgeTemplateRequiredUtmSourceRule implements BadgeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeTemplate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeTemplateUtmSourceLengthRule implements BadgeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeTemplate): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeTemplateClicksRangeRule implements BadgeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeTemplate): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeTemplateCodePrefixRule implements BadgeTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeTemplateCodeLengthRule implements BadgeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeTemplateNameLengthRule implements BadgeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a badge template. */
export class BadgeTemplateValidator {
  rules: BadgeTemplateRule[];

  constructor(rules: BadgeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeTemplate): string[] {
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

  requireValid(item: BadgeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeTemplate[]): Map<string, string[]> {
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

export function defaultBadgeTemplateValidator(): BadgeTemplateValidator {
  return new BadgeTemplateValidator(
    [
      new BadgeTemplateRequiredUtmSourceRule("badge template needs an entry"),
      new BadgeTemplateUtmSourceLengthRule(120),
      new BadgeTemplateClicksRangeRule(16, 64),
      new BadgeTemplateCodePrefixRule("ACM"),
      new BadgeTemplateCodeLengthRule(86400),
      new BadgeTemplateNameLengthRule(3600),
    ],
  );
}
