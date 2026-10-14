import * as text from "../../../../kit/text.js";
import { ActivationManifest } from "./activation-manifest.js";

/** A rule a activation manifest must pass. Check returns its problems, or none. */
export interface ActivationManifestRule {
  check(item: ActivationManifest): string[];
}

export class ActivationManifestScoreRangeRule implements ActivationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationManifest): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationManifestFrequencyCapRangeRule implements ActivationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationManifest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationManifestCreatedAtRangeRule implements ActivationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationManifest): string[] {
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

export class ActivationManifestAllowedChannelRule implements ActivationManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a activation manifest. */
export class ActivationManifestValidator {
  rules: ActivationManifestRule[];

  constructor(rules: ActivationManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationManifest): string[] {
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

  requireValid(item: ActivationManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationManifest[]): Map<string, string[]> {
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

export function defaultActivationManifestValidator(): ActivationManifestValidator {
  return new ActivationManifestValidator(
    [
      new ActivationManifestScoreRangeRule(1.1, 2293.6),
      new ActivationManifestFrequencyCapRangeRule(80, 80),
      new ActivationManifestCreatedAtRangeRule(64, 255),
      new ActivationManifestAllowedChannelRule(["global", "pending"]),
    ],
  );
}
