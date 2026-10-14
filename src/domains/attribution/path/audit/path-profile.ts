import * as text from "../../../../kit/text.js";

/** Where a path profile is in its life cycle. */
export type PathProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A path profile as the path team keeps it. */
export class PathProfile {
  code: string;
  title: string;
  clicks: number;
  conversionRate: number;
  ceiling: number;
  status: PathProfileStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    conversionRate: number,
    ceiling: number,
    status: PathProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.conversionRate = conversionRate;
    this.ceiling = ceiling;
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

  canMoveTo(next: PathProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round(this.clicks * this.ceiling * 100) / 100;
  }

  copy(): PathProfile {
    return new PathProfile(this.code, this.title, this.clicks, this.conversionRate, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path profile in status open. */
export function newPathProfile(code: string, title: string): PathProfile {
  return new PathProfile(code, title, 0, 0, 0, "open");
}
