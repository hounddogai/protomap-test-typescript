import * as text from "../../../../kit/text.js";

/** Where a window baseline is in its life cycle. */
export type WindowBaselineStatus = "created" | "validated" | "published" | "retired";

/** One window baseline, with what the planners need to act on it. */
export class WindowBaseline {
  code: string;
  name: string;
  utmSource: string;
  openRate: number;
  reviewer: string;
  priority: number;
  status: WindowBaselineStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    openRate: number,
    reviewer: string,
    priority: number,
    status: WindowBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.reviewer = reviewer;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round(this.openRate * this.priority * 100) / 100;
  }

  copy(): WindowBaseline {
    return new WindowBaseline(
      this.code,
      this.name,
      this.utmSource,
      this.openRate,
      this.reviewer,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a window baseline in status created. */
export function newWindowBaseline(code: string, name: string): WindowBaseline {
  return new WindowBaseline(code, name, "", 0, "", 0, "created");
}
