import { WeightedMentionAudit } from "./weighted-mention-audit.js";

/** A rule a weighted mention audit must pass. Check returns its problems, or none. */
export interface WeightedMentionAuditRule {
  check(item: WeightedMentionAudit): string[];
}

export class WeightedMentionAuditCodePrefixRule implements WeightedMentionAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedMentionAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedMentionAuditRequiredLocaleRule implements WeightedMentionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMentionAuditLabelLengthRule implements WeightedMentionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedMentionAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedMentionAuditRequiredCodeRule implements WeightedMentionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted mention audit. */
export class WeightedMentionAuditValidator {
  rules: WeightedMentionAuditRule[];

  constructor(rules: WeightedMentionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedMentionAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedMentionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedMentionAudit[]): Map<string, string[]> {
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

export function defaultWeightedMentionAuditValidator(): WeightedMentionAuditValidator {
  return new WeightedMentionAuditValidator(
    [
      new WeightedMentionAuditCodePrefixRule("OPS"),
      new WeightedMentionAuditRequiredLocaleRule("weighted mention audit needs this field"),
      new WeightedMentionAuditLabelLengthRule(120),
      new WeightedMentionAuditRequiredCodeRule("weighted mention audit needs a value"),
    ],
  );
}
