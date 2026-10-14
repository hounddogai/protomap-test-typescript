import { PrimaryFunnelTarget } from "./primary-funnel-target.js";

/** A rule a primary funnel target must pass. Check returns its problems, or none. */
export interface PrimaryFunnelTargetRule {
  check(item: PrimaryFunnelTarget): string[];
}

export class PrimaryFunnelTargetCodePrefixRule implements PrimaryFunnelTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryFunnelTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryFunnelTargetRequiredSourceRule implements PrimaryFunnelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelTarget): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFunnelTargetAmountRangeRule implements PrimaryFunnelTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFunnelTarget): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryFunnelTargetRequiredOwnerIdRule implements PrimaryFunnelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelTarget): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFunnelTargetRequiredCodeRule implements PrimaryFunnelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary funnel target. */
export class PrimaryFunnelTargetValidator {
  rules: PrimaryFunnelTargetRule[];

  constructor(rules: PrimaryFunnelTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFunnelTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFunnelTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFunnelTarget[]): Map<string, string[]> {
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

export function defaultPrimaryFunnelTargetValidator(): PrimaryFunnelTargetValidator {
  return new PrimaryFunnelTargetValidator(
    [
      new PrimaryFunnelTargetCodePrefixRule("X"),
      new PrimaryFunnelTargetRequiredSourceRule("primary funnel target needs this field"),
      new PrimaryFunnelTargetAmountRangeRule(9.6, 2476.5),
      new PrimaryFunnelTargetRequiredOwnerIdRule("primary funnel target needs this field"),
      new PrimaryFunnelTargetRequiredCodeRule("primary funnel target needs a value"),
    ],
  );
}
