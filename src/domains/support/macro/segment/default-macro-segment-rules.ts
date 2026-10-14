import * as text from "../../../../kit/text.js";
import { DefaultMacroSegment } from "./default-macro-segment.js";

/** A rule a default macro segment must pass. Check returns its problems, or none. */
export interface DefaultMacroSegmentRule {
  check(item: DefaultMacroSegment): string[];
}

export class DefaultMacroSegmentVersionRangeRule implements DefaultMacroSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultMacroSegment): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultMacroSegmentCeilingRangeRule implements DefaultMacroSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultMacroSegment): string[] {
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

export class DefaultMacroSegmentRequiredLabelRule implements DefaultMacroSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMacroSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMacroSegmentAllowedCodeRule implements DefaultMacroSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultMacroSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class DefaultMacroSegmentWeightRangeRule implements DefaultMacroSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultMacroSegment): string[] {
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

/** Runs every rule of a default macro segment. */
export class DefaultMacroSegmentValidatorExtra {
  rules: DefaultMacroSegmentRule[];

  constructor(rules: DefaultMacroSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMacroSegment): string[] {
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

  requireValid(item: DefaultMacroSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMacroSegment[]): Map<string, string[]> {
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

export function defaultDefaultMacroSegmentValidator(): DefaultMacroSegmentValidatorExtra {
  return new DefaultMacroSegmentValidatorExtra(
    [
      new DefaultMacroSegmentVersionRangeRule(16, 86400),
      new DefaultMacroSegmentCeilingRangeRule(8.6, 2812.7),
      new DefaultMacroSegmentRequiredLabelRule("default macro segment needs a value"),
      new DefaultMacroSegmentAllowedCodeRule(["tiered", "capped"]),
      new DefaultMacroSegmentWeightRangeRule(3, 58.9),
    ],
  );
}
