import * as text from "../../../../kit/text.js";

/** Where a warmup assignment is in its life cycle. */
export type WarmupAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A warmup assignment as the warmup team keeps it. */
export class WarmupAssignment {
  code: string;
  title: string;
  active: boolean;
  currency: string;
  createdAt: number;
  region: string;
  status: WarmupAssignmentStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    currency: string,
    createdAt: number,
    region: string,
    status: WarmupAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.currency = currency;
    this.createdAt = createdAt;
    this.region = region;
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

  canMoveTo(next: WarmupAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
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

  moveTo(next: WarmupAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"warmup assignment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): WarmupAssignment {
    return new WarmupAssignment(
      this.code,
      this.title,
      this.active,
      this.currency,
      this.createdAt,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a warmup assignment in status open. */
export function newWarmupAssignment(code: string, title: string): WarmupAssignment {
  return new WarmupAssignment(code, title, false, "", 0, "", "open");
}
