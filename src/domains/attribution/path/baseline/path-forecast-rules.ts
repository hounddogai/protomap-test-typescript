import { PathForecast } from "./path-forecast.js";

/** A rule a path forecast must pass. Check returns its problems, or none. */
export interface PathForecastRule {
  check(item: PathForecast): string[];
}

export class PathForecastCodePrefixRule implements PathForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathForecastRequiredNameRule implements PathForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PathForecastRegionLengthRule implements PathForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathForecast): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path forecast. */
export class PathForecastValidator {
  rules: PathForecastRule[];

  constructor(rules: PathForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PathForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathForecast[]): Map<string, string[]> {
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

export function defaultPathForecastValidator(): PathForecastValidator {
  return new PathForecastValidator(
    [
      new PathForecastCodePrefixRule("ACM"),
      new PathForecastRequiredNameRule("path forecast needs a value"),
      new PathForecastRegionLengthRule(1000),
    ],
  );
}
