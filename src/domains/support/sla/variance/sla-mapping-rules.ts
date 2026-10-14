import * as text from "../../../../kit/text.js";
import { SlaMapping } from "./sla-mapping.js";

/** A rule a sla mapping must pass. Check returns its problems, or none. */
export interface SlaMappingRule {
  check(item: SlaMapping): string[];
}

export class SlaMappingAllowedExternalRefRule implements SlaMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is unknown`];
    return [];
  }
}

export class SlaMappingVersionRangeRule implements SlaMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaMapping): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaMappingRequiredCodeRule implements SlaMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaMappingCodeLengthRule implements SlaMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaMappingTagsLimitRule implements SlaMappingRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SlaMapping): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a sla mapping. */
export class SlaMappingValidator {
  rules: SlaMappingRule[];

  constructor(rules: SlaMappingRule[]) {
    this.rules = rules;
  }

  validate(item: SlaMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaMapping[]): Map<string, string[]> {
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

export function defaultSlaMappingValidator(): SlaMappingValidator {
  return new SlaMappingValidator(
    [
      new SlaMappingAllowedExternalRefRule(["scheduled", "adaptive"]),
      new SlaMappingVersionRangeRule(64, 3600),
      new SlaMappingRequiredCodeRule("sla mapping needs this field"),
      new SlaMappingCodeLengthRule(64),
      new SlaMappingTagsLimitRule(32, ["strict", "weighted", "manual"]),
    ],
  );
}
