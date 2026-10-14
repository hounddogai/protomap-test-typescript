import { LevelAudit } from "./level-audit.js";

/** A rule a level audit must pass. Check returns its problems, or none. */
export interface LevelAuditRule {
  check(item: LevelAudit): string[];
}

export class LevelAuditChannelLengthRule implements LevelAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelAuditCodePrefixRule implements LevelAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelAuditRequiredCodeRule implements LevelAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelAuditCreatedAtRangeRule implements LevelAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelAudit): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelAuditMarginRangeRule implements LevelAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelAudit): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelAuditRequiredChannelRule implements LevelAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelAudit): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level audit. */
export class LevelAuditValidator {
  rules: LevelAuditRule[];

  constructor(rules: LevelAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LevelAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelAudit[]): Map<string, string[]> {
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

export function defaultLevelAuditValidator(): LevelAuditValidator {
  return new LevelAuditValidator(
    [
      new LevelAuditChannelLengthRule(255),
      new LevelAuditCodePrefixRule("Q"),
      new LevelAuditRequiredCodeRule("level audit needs a value"),
      new LevelAuditCreatedAtRangeRule(3600, 86400),
      new LevelAuditMarginRangeRule(8.6, 2380.9),
      new LevelAuditRequiredChannelRule("level audit needs this field"),
    ],
  );
}
