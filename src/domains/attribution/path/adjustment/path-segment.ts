import * as text from "../../../../kit/text.js";

/** Where a path segment is in its life cycle. */
export type PathSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A path segment. Its code is unique within a tenant. */
export class PathSegment {
  code: string;
  title: string;
  clicks: number;
  country: string;
  variant: string;
  status: PathSegmentStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    country: string,
    variant: string,
    status: PathSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.country = country;
    this.variant = variant;
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

  canMoveTo(next: PathSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"path segment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): PathSegment {
    return new PathSegment(this.code, this.title, this.clicks, this.country, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a path segment in status open. */
export function newPathSegment(code: string, title: string): PathSegment {
  return new PathSegment(code, title, 0, "", "", "open");
}
