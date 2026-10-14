import * as text from "../../../../kit/text.js";

/** Where a manual nudge baseline is in its life cycle. */
export type ManualNudgeBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual nudge baseline as the nudge team keeps it. */
export class ManualNudgeBaseline {
  code: string;
  title: string;
  name: string;
  ownerId: string;
  windowDays: number;
  status: ManualNudgeBaselineStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    ownerId: string,
    windowDays: number,
    status: ManualNudgeBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
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

  canMoveTo(next: ManualNudgeBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
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
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualNudgeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual nudge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual nudge baseline"} ${this.code}`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): ManualNudgeBaseline {
    return new ManualNudgeBaseline(this.code, this.title, this.name, this.ownerId, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual nudge baseline in status open. */
export function newManualNudgeBaseline(code: string, title: string): ManualNudgeBaseline {
  return new ManualNudgeBaseline(code, title, "", "", 0, "open");
}
