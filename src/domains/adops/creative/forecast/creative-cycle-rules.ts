import * as text from "../../../../kit/text.js";
import { CreativeCycle } from "./creative-cycle.js";

/** A rule a creative cycle must pass. Check returns its problems, or none. */
export interface CreativeCycleRule {
  check(item: CreativeCycle): string[];
}

export class CreativeCycleRequiredNameRule implements CreativeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeCycleAllowedCodeRule implements CreativeCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class CreativeCycleNameLengthRule implements CreativeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeCycleRequiredCategoryRule implements CreativeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeCycle): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeCycleCodeLengthRule implements CreativeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative cycle. */
export class CreativeCycleValidator {
  rules: CreativeCycleRule[];

  constructor(rules: CreativeCycleRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeCycle): string[] {
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

  requireValid(item: CreativeCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeCycle[]): Map<string, string[]> {
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

export function defaultCreativeCycleValidator(): CreativeCycleValidator {
  return new CreativeCycleValidator(
    [
      new CreativeCycleRequiredNameRule("creative cycle needs this field"),
      new CreativeCycleAllowedCodeRule(["lenient"]),
      new CreativeCycleNameLengthRule(16),
      new CreativeCycleRequiredCategoryRule("creative cycle needs this field"),
      new CreativeCycleCodeLengthRule(16),
    ],
  );
}
