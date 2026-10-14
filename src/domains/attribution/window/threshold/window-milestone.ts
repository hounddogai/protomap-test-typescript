import * as text from "../../../../kit/text.js";

/** Where a window milestone is in its life cycle. */
export type WindowMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** A window milestone as the window team keeps it. */
export class WindowMilestone {
  code: string;
  label: string;
  externalRef: string;
  attempts: number;
  ratio: number;
  status: WindowMilestoneStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    attempts: number,
    ratio: number,
    status: WindowMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"window milestone"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.attempts - this.ratio) * 100) / 100;
  }

  copy(): WindowMilestone {
    return new WindowMilestone(this.code, this.label, this.externalRef, this.attempts, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a window milestone in status new. */
export function newWindowMilestone(code: string, label: string): WindowMilestone {
  return new WindowMilestone(code, label, "", 0, 0, "new");
}
