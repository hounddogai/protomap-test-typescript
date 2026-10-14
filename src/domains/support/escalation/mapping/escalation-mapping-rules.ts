import { EscalationMapping } from "./escalation-mapping.js";

/** A rule a escalation mapping must pass. Check returns its problems, or none. */
export interface EscalationMappingRule {
  check(item: EscalationMapping): string[];
}

export class EscalationMappingRequiredCodeRule implements EscalationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationMappingRequiredTitleRule implements EscalationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationMappingCodePrefixRule implements EscalationMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationMappingImpressionsRangeRule implements EscalationMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationMapping): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a escalation mapping. */
export class EscalationMappingValidator {
  rules: EscalationMappingRule[];

  constructor(rules: EscalationMappingRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationMapping[]): Map<string, string[]> {
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

export function defaultEscalationMappingValidator(): EscalationMappingValidator {
  return new EscalationMappingValidator(
    [
      new EscalationMappingRequiredCodeRule("escalation mapping needs a value"),
      new EscalationMappingRequiredTitleRule("escalation mapping needs this field"),
      new EscalationMappingCodePrefixRule("REF"),
      new EscalationMappingImpressionsRangeRule(32, 80),
    ],
  );
}
