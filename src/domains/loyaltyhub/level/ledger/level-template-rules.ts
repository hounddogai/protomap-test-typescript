import { LevelTemplate } from "./level-template.js";

/** A rule a level template must pass. Check returns its problems, or none. */
export interface LevelTemplateRule {
  check(item: LevelTemplate): string[];
}

export class LevelTemplateArchivedGuardRule implements LevelTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LevelTemplate): string[] {
    if (item.archived && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LevelTemplateRequiredChecksumRule implements LevelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelTemplate): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class LevelTemplateRequiredCodeRule implements LevelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelTemplateCeilingRangeRule implements LevelTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelTemplate): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelTemplateCodePrefixRule implements LevelTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelTemplateRequiredNameRule implements LevelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level template. */
export class LevelTemplateValidator {
  rules: LevelTemplateRule[];

  constructor(rules: LevelTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LevelTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelTemplate[]): Map<string, string[]> {
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

export function defaultLevelTemplateValidator(): LevelTemplateValidator {
  return new LevelTemplateValidator(
    [
      new LevelTemplateArchivedGuardRule(0.3),
      new LevelTemplateRequiredChecksumRule("level template needs this field"),
      new LevelTemplateRequiredCodeRule("level template needs an entry"),
      new LevelTemplateCeilingRangeRule(5.2, 3867.8),
      new LevelTemplateCodePrefixRule("Q"),
      new LevelTemplateRequiredNameRule("level template needs an entry"),
    ],
  );
}
