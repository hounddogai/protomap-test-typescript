import { RollingRetentionTemplate } from "./rolling-retention-template.js";

/** A rule a rolling retention template must pass. Check returns its problems, or none. */
export interface RollingRetentionTemplateRule {
  check(item: RollingRetentionTemplate): string[];
}

export class RollingRetentionTemplateCodeLengthRule implements RollingRetentionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRetentionTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRetentionTemplateRequiredNameRule implements RollingRetentionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRetentionTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRetentionTemplateNameLengthRule implements RollingRetentionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRetentionTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRetentionTemplateRequiredTitleRule implements RollingRetentionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRetentionTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRetentionTemplateRequiredCodeRule implements RollingRetentionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRetentionTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRetentionTemplateArchivedGuardRule implements RollingRetentionTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingRetentionTemplate): string[] {
    if (item.archived && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a rolling retention template. */
export class RollingRetentionTemplateValidator {
  rules: RollingRetentionTemplateRule[];

  constructor(rules: RollingRetentionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RollingRetentionTemplate): string[] {
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

  requireValid(item: RollingRetentionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingRetentionTemplate[]): Map<string, string[]> {
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

export function defaultRollingRetentionTemplateValidator(): RollingRetentionTemplateValidator {
  return new RollingRetentionTemplateValidator(
    [
      new RollingRetentionTemplateCodeLengthRule(120),
      new RollingRetentionTemplateRequiredNameRule("rolling retention template needs a value"),
      new RollingRetentionTemplateNameLengthRule(1000),
      new RollingRetentionTemplateRequiredTitleRule("rolling retention template needs an entry"),
      new RollingRetentionTemplateRequiredCodeRule("rolling retention template needs an entry"),
      new RollingRetentionTemplateArchivedGuardRule(3.8),
    ],
  );
}
