import * as text from "../../../../kit/text.js";

/** Where a path override is in its life cycle. */
export type PathOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One path override, with what the planners need to act on it. */
export class PathOverride {
  code: string;
  title: string;
  amount: number;
  conversionRate: number;
  updatedAt: number;
  utmSource: string;
  status: PathOverrideStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    conversionRate: number,
    updatedAt: number,
    utmSource: string,
    status: PathOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.conversionRate = conversionRate;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PathOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"path override"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.amount + this.conversionRate) * 100) / 100;
  }

  copy(): PathOverride {
    return new PathOverride(
      this.code,
      this.title,
      this.amount,
      this.conversionRate,
      this.updatedAt,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a path override in status open. */
export function newPathOverride(code: string, title: string): PathOverride {
  return new PathOverride(code, title, 0, 0, 0, "", "open");
}
