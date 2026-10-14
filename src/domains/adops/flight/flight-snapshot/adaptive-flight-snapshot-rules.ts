import * as text from "../../../../kit/text.js";
import { AdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

/** A rule a adaptive flight snapshot must pass. Check returns its problems, or none. */
export interface AdaptiveFlightSnapshotRule {
  check(item: AdaptiveFlightSnapshot): string[];
}

export class AdaptiveFlightSnapshotAllowedRegionRule implements AdaptiveFlightSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveFlightSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is below minimum`];
    return [];
  }
}

export class AdaptiveFlightSnapshotRatioRangeRule implements AdaptiveFlightSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFlightSnapshot): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveFlightSnapshotRequiredLabelRule implements AdaptiveFlightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFlightSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive flight snapshot. */
export class AdaptiveFlightSnapshotValidator {
  rules: AdaptiveFlightSnapshotRule[];

  constructor(rules: AdaptiveFlightSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFlightSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFlightSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFlightSnapshot[]): Map<string, string[]> {
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

export function defaultAdaptiveFlightSnapshotValidator(): AdaptiveFlightSnapshotValidator {
  return new AdaptiveFlightSnapshotValidator(
    [
      new AdaptiveFlightSnapshotAllowedRegionRule(["manual", "weighted"]),
      new AdaptiveFlightSnapshotRatioRangeRule(0.6, 2031.3),
      new AdaptiveFlightSnapshotRequiredLabelRule("adaptive flight snapshot needs a value"),
    ],
  );
}
