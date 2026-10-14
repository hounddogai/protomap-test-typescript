/**
 * The sla plan records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla plan is in its life cycle. */
export type SlaPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One sla plan, with what the planners need to act on it. */
export class SlaPlan {
  code: string;
  title: string;
  timezone: string;
  revision: number;
  sequence: number;
  status: SlaPlanStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    revision: number,
    sequence: number,
    status: SlaPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.revision = revision;
    this.sequence = sequence;
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

  canMoveTo(next: SlaPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: SlaPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round(this.revision * this.sequence * 100) / 100;
  }

  copy(): SlaPlan {
    return new SlaPlan(this.code, this.title, this.timezone, this.revision, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sla plan in status open. */
export function newSlaPlan(code: string, title: string): SlaPlan {
  return new SlaPlan(code, title, "", 0, 0, "open");
}
