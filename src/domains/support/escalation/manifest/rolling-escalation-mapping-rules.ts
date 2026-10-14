import { RollingEscalationMapping } from "./rolling-escalation-mapping.js";

/** A rule a rolling escalation mapping must pass. Check returns its problems, or none. */
export interface RollingEscalationMappingRule {
  check(item: RollingEscalationMapping): string[];
}

export class RollingEscalationMappingRequiredLabelRule implements RollingEscalationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingEscalationMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingEscalationMappingOpenRateRangeRule implements RollingEscalationMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingEscalationMapping): string[] {
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

export class RollingEscalationMappingRequiredCodeRule implements RollingEscalationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingEscalationMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingEscalationMappingActiveGuardRule implements RollingEscalationMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingEscalationMapping): string[] {
    if (item.active && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RollingEscalationMappingCodePrefixRule implements RollingEscalationMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingEscalationMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingEscalationMappingLimitRangeRule implements RollingEscalationMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingEscalationMapping): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling escalation mapping. */
export class RollingEscalationMappingValidator {
  rules: RollingEscalationMappingRule[];

  constructor(rules: RollingEscalationMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RollingEscalationMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingEscalationMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingEscalationMapping[]): Map<string, string[]> {
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

export function defaultRollingEscalationMappingValidator(): RollingEscalationMappingValidator {
  return new RollingEscalationMappingValidator(
    [
      new RollingEscalationMappingRequiredLabelRule("rolling escalation mapping needs an entry"),
      new RollingEscalationMappingOpenRateRangeRule(2.3, 1887.2),
      new RollingEscalationMappingRequiredCodeRule("rolling escalation mapping needs an entry"),
      new RollingEscalationMappingActiveGuardRule(4.7),
      new RollingEscalationMappingCodePrefixRule("X"),
      new RollingEscalationMappingLimitRangeRule(3600, 86400),
    ],
  );
}
