import { ApprovalTemplate } from "./approval-template.js";

/** A rule a approval template must pass. Check returns its problems, or none. */
export interface ApprovalTemplateRule {
  check(item: ApprovalTemplate): string[];
}

export class ApprovalTemplateTitleLengthRule implements ApprovalTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalTemplateRequiredExternalRefRule implements ApprovalTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalTemplate): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalTemplateCodePrefixRule implements ApprovalTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalTemplateCodeLengthRule implements ApprovalTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalTemplateImpressionsRangeRule implements ApprovalTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalTemplate): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a approval template. */
export class ApprovalTemplateValidator {
  rules: ApprovalTemplateRule[];

  constructor(rules: ApprovalTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalTemplate[]): Map<string, string[]> {
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

export function defaultApprovalTemplateValidator(): ApprovalTemplateValidator {
  return new ApprovalTemplateValidator(
    [
      new ApprovalTemplateTitleLengthRule(3600),
      new ApprovalTemplateRequiredExternalRefRule("approval template needs this field"),
      new ApprovalTemplateCodePrefixRule("REF"),
      new ApprovalTemplateCodeLengthRule(80),
      new ApprovalTemplateImpressionsRangeRule(64, 3600),
    ],
  );
}
