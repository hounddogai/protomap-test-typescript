import { PrimaryPathSlot } from "./primary-path-slot.js";

/** A rule a primary path slot must pass. Check returns its problems, or none. */
export interface PrimaryPathSlotRule {
  check(item: PrimaryPathSlot): string[];
}

export class PrimaryPathSlotCodePrefixRule implements PrimaryPathSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryPathSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryPathSlotCodeLengthRule implements PrimaryPathSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPathSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPathSlotNameLengthRule implements PrimaryPathSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPathSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPathSlotWeightRangeRule implements PrimaryPathSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPathSlot): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryPathSlotRequiredCodeRule implements PrimaryPathSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPathSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary path slot. */
export class PrimaryPathSlotValidator {
  rules: PrimaryPathSlotRule[];

  constructor(rules: PrimaryPathSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPathSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPathSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPathSlot[]): Map<string, string[]> {
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

export function defaultPrimaryPathSlotValidator(): PrimaryPathSlotValidator {
  return new PrimaryPathSlotValidator(
    [
      new PrimaryPathSlotCodePrefixRule("X"),
      new PrimaryPathSlotCodeLengthRule(64),
      new PrimaryPathSlotNameLengthRule(3600),
      new PrimaryPathSlotWeightRangeRule(2, 2972.1),
      new PrimaryPathSlotRequiredCodeRule("primary path slot needs this field"),
    ],
  );
}
