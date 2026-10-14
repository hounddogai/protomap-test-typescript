import * as text from "../../../../kit/text.js";

/** Where a strict queue target is in its life cycle. */
export type StrictQueueTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict queue target, with what the planners need to act on it. */
export class StrictQueueTarget {
  code: string;
  title: string;
  minimum: number;
  capacity: number;
  phone: string;
  audienceId: string;
  status: StrictQueueTargetStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    capacity: number,
    phone: string,
    audienceId: string,
    status: StrictQueueTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.capacity = capacity;
    this.phone = phone;
    this.audienceId = audienceId;
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

  canMoveTo(next: StrictQueueTargetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: StrictQueueTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict queue target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict queue target"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.minimum + this.capacity) * 100) / 100;
  }

  copy(): StrictQueueTarget {
    return new StrictQueueTarget(
      this.code,
      this.title,
      this.minimum,
      this.capacity,
      this.phone,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict queue target in status open. */
export function newStrictQueueTarget(code: string, title: string): StrictQueueTarget {
  return new StrictQueueTarget(code, title, 0, 0, "", "", "open");
}
