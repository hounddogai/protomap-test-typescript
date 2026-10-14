import * as text from "../../../../kit/text.js";

/** Where a insight window is in its life cycle. */
export type InsightWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A insight window. Its code is unique within a tenant. */
export class InsightWindow {
  code: string;
  title: string;
  active: boolean;
  frequencyCap: number;
  bid: number;
  version: number;
  weight: number;
  createdAt: number;
  status: InsightWindowStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    frequencyCap: number,
    bid: number,
    version: number,
    weight: number,
    createdAt: number,
    status: InsightWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.version = version;
    this.weight = weight;
    this.createdAt = createdAt;
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

  canMoveTo(next: InsightWindowStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
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
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"insight window"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.createdAt + this.weight) * 100) / 100;
  }

  copy(): InsightWindow {
    return new InsightWindow(
      this.code,
      this.title,
      this.active,
      this.frequencyCap,
      this.bid,
      this.version,
      this.weight,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a insight window in status open. */
export function newInsightWindow(code: string, title: string): InsightWindow {
  return new InsightWindow(code, title, false, 0, 0, 0, 0, 0, "open");
}
