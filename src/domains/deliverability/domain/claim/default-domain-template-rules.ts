import * as text from "../../../../kit/text.js";
import { DefaultDomainTemplate } from "./default-domain-template.js";

/** A rule a default domain template must pass. Check returns its problems, or none. */
export interface DefaultDomainTemplateRule {
  check(item: DefaultDomainTemplate): string[];
}

export class DefaultDomainTemplateAllowedNameRule implements DefaultDomainTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultDomainTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class DefaultDomainTemplateRequiredUtmSourceRule implements DefaultDomainTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultDomainTemplate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultDomainTemplateRequiredNameRule implements DefaultDomainTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultDomainTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default domain template. */
export class DefaultDomainTemplateValidator {
  rules: DefaultDomainTemplateRule[];

  constructor(rules: DefaultDomainTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultDomainTemplate): string[] {
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

  requireValid(item: DefaultDomainTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultDomainTemplate[]): Map<string, string[]> {
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

export function defaultDefaultDomainTemplateValidator(): DefaultDomainTemplateValidator {
  return new DefaultDomainTemplateValidator(
    [
      new DefaultDomainTemplateAllowedNameRule(["tiered", "lenient"]),
      new DefaultDomainTemplateRequiredUtmSourceRule("default domain template needs this field"),
      new DefaultDomainTemplateRequiredNameRule("default domain template needs an entry"),
    ],
  );
}
