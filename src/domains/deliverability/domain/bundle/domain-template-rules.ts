import * as text from "../../../../kit/text.js";
import { DomainTemplate } from "./domain-template.js";

/** A rule a domain template must pass. Check returns its problems, or none. */
export interface DomainTemplateRule {
  check(item: DomainTemplate): string[];
}

export class DomainTemplateOpenRateRangeRule implements DomainTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainTemplate): string[] {
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

export class DomainTemplateRequiredUtmSourceRule implements DomainTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainTemplate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class DomainTemplateDescriptionLengthRule implements DomainTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainTemplate): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainTemplateExpiresAtRangeRule implements DomainTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainTemplate): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainTemplateAllowedUtmSourceRule implements DomainTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is inconsistent`];
    return [];
  }
}

export class DomainTemplateRequiredCodeRule implements DomainTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain template. */
export class DomainTemplateValidator {
  rules: DomainTemplateRule[];

  constructor(rules: DomainTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DomainTemplate): string[] {
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

  requireValid(item: DomainTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainTemplate[]): Map<string, string[]> {
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

export function defaultDomainTemplateValidator(): DomainTemplateValidator {
  return new DomainTemplateValidator(
    [
      new DomainTemplateOpenRateRangeRule(6.2, 3541.5),
      new DomainTemplateRequiredUtmSourceRule("domain template needs an entry"),
      new DomainTemplateDescriptionLengthRule(1000),
      new DomainTemplateExpiresAtRangeRule(80, 3600),
      new DomainTemplateAllowedUtmSourceRule(["fallback"]),
      new DomainTemplateRequiredCodeRule("domain template needs an entry"),
    ],
  );
}
