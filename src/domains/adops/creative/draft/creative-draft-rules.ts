import { CreativeDraft } from "./creative-draft.js";

/** A rule a creative draft must pass. Check returns its problems, or none. */
export interface CreativeDraftRule {
  check(item: CreativeDraft): string[];
}

export class CreativeDraftRequiredCodeRule implements CreativeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeDraftRequiredTitleRule implements CreativeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeDraftCodeLengthRule implements CreativeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative draft. */
export class CreativeDraftValidator {
  rules: CreativeDraftRule[];

  constructor(rules: CreativeDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeDraft): string[] {
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

  requireValid(item: CreativeDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeDraft[]): Map<string, string[]> {
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

export function defaultCreativeDraftValidator(): CreativeDraftValidator {
  return new CreativeDraftValidator(
    [
      new CreativeDraftRequiredCodeRule("creative draft needs an entry"),
      new CreativeDraftRequiredTitleRule("creative draft needs a value"),
      new CreativeDraftCodeLengthRule(80),
    ],
  );
}
