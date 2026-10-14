import * as text from "../../../../kit/text.js";

/** Where a global reputation notice is in its life cycle. */
export type GlobalReputationNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** One global reputation notice, with what the planners need to act on it. */
export class GlobalReputationNotice {
  code: string;
  title: string;
  visible: boolean;
  rate: number;
  budget: number;
  priority: number;
  status: GlobalReputationNoticeStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    rate: number,
    budget: number,
    priority: number,
    status: GlobalReputationNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.rate = rate;
    this.budget = budget;
    this.priority = priority;
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

  canMoveTo(next: GlobalReputationNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalReputationNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reputation notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round((this.priority - this.budget) * 100) / 100;
  }

  copy(): GlobalReputationNotice {
    return new GlobalReputationNotice(
      this.code,
      this.title,
      this.visible,
      this.rate,
      this.budget,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global reputation notice in status new. */
export function newGlobalReputationNotice(code: string, title: string): GlobalReputationNotice {
  return new GlobalReputationNotice(code, title, false, 0, 0, 0, "new");
}
