import { AdaptiveSenderTemplate } from "./adaptive-sender-template.js";

/** A rule a adaptive sender template must pass. Check returns its problems, or none. */
export interface AdaptiveSenderTemplateRule {
  check(item: AdaptiveSenderTemplate): string[];
}

export class AdaptiveSenderTemplateRequiredCodeRule implements AdaptiveSenderTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSenderTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSenderTemplateAttemptsRangeRule implements AdaptiveSenderTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSenderTemplate): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveSenderTemplateCodePrefixRule implements AdaptiveSenderTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveSenderTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive sender template. */
export class AdaptiveSenderTemplateValidator {
  rules: AdaptiveSenderTemplateRule[];

  constructor(rules: AdaptiveSenderTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSenderTemplate): string[] {
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

  requireValid(item: AdaptiveSenderTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSenderTemplate[]): Map<string, string[]> {
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

export function defaultAdaptiveSenderTemplateValidator(): AdaptiveSenderTemplateValidator {
  return new AdaptiveSenderTemplateValidator(
    [
      new AdaptiveSenderTemplateRequiredCodeRule("adaptive sender template needs this field"),
      new AdaptiveSenderTemplateAttemptsRangeRule(16, 86400),
      new AdaptiveSenderTemplateCodePrefixRule("REF"),
    ],
  );
}
