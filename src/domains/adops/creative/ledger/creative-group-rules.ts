import { CreativeGroup } from "./creative-group.js";

/** A rule a creative group must pass. Check returns its problems, or none. */
export interface CreativeGroupRule {
  check(item: CreativeGroup): string[];
}

export class CreativeGroupCodeLengthRule implements CreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeGroupLimitRangeRule implements CreativeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeGroup): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeGroupTitleLengthRule implements CreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeGroupRequiredTitleRule implements CreativeGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeGroupExternalRefLengthRule implements CreativeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeGroup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative group. */
export class CreativeGroupValidator {
  rules: CreativeGroupRule[];

  constructor(rules: CreativeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeGroup[]): Map<string, string[]> {
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

export function defaultCreativeGroupValidator(): CreativeGroupValidator {
  return new CreativeGroupValidator(
    [
      new CreativeGroupCodeLengthRule(1000),
      new CreativeGroupLimitRangeRule(64, 80),
      new CreativeGroupTitleLengthRule(120),
      new CreativeGroupRequiredTitleRule("creative group needs a value"),
      new CreativeGroupExternalRefLengthRule(86400),
    ],
  );
}
