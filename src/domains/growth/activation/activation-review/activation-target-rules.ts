import { ActivationTarget } from "./activation-target.js";

/** A rule a activation target must pass. Check returns its problems, or none. */
export interface ActivationTargetRule {
  check(item: ActivationTarget): string[];
}

export class ActivationTargetNameLengthRule implements ActivationTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationTargetRequiredCodeRule implements ActivationTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationTargetOpenRateRangeRule implements ActivationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationTarget): string[] {
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

export class ActivationTargetQuantityRangeRule implements ActivationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationTarget): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationTargetActiveGuardRule implements ActivationTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ActivationTarget): string[] {
    if (item.active && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a activation target. */
export class ActivationTargetValidator {
  rules: ActivationTargetRule[];

  constructor(rules: ActivationTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationTarget[]): Map<string, string[]> {
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

export function defaultActivationTargetValidator(): ActivationTargetValidator {
  return new ActivationTargetValidator(
    [
      new ActivationTargetNameLengthRule(3600),
      new ActivationTargetRequiredCodeRule("activation target needs a value"),
      new ActivationTargetOpenRateRangeRule(5.1, 4198.4),
      new ActivationTargetQuantityRangeRule(64, 1000),
      new ActivationTargetActiveGuardRule(64),
    ],
  );
}
