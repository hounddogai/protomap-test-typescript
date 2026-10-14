import * as text from "../../../../kit/text.js";
import { WarmupCheckpoint } from "./warmup-checkpoint.js";

/** A rule a warmup checkpoint must pass. Check returns its problems, or none. */
export interface WarmupCheckpointRule {
  check(item: WarmupCheckpoint): string[];
}

export class WarmupCheckpointRequiredVariantRule implements WarmupCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupCheckpoint): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupCheckpointLabelLengthRule implements WarmupCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupCheckpointCodePrefixRule implements WarmupCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupCheckpointCodeLengthRule implements WarmupCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupCheckpointAllowedLabelRule implements WarmupCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

/** Runs every rule of a warmup checkpoint. */
export class WarmupCheckpointValidator {
  rules: WarmupCheckpointRule[];

  constructor(rules: WarmupCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupCheckpoint): string[] {
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

  requireValid(item: WarmupCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupCheckpoint[]): Map<string, string[]> {
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

export function defaultWarmupCheckpointValidator(): WarmupCheckpointValidator {
  return new WarmupCheckpointValidator(
    [
      new WarmupCheckpointRequiredVariantRule("warmup checkpoint needs a value"),
      new WarmupCheckpointLabelLengthRule(255),
      new WarmupCheckpointCodePrefixRule("OPS"),
      new WarmupCheckpointCodeLengthRule(1000),
      new WarmupCheckpointAllowedLabelRule([]),
    ],
  );
}
