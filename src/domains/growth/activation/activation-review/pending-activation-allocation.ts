import * as text from "../../../../kit/text.js";

/** Where a pending activation allocation is in its life cycle. */
export type PendingActivationAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending activation allocation. Its code is unique within a tenant. */
export class PendingActivationAllocation {
  code: string;
  title: string;
  capacity: number;
  channel: string;
  utmSource: string;
  priority: number;
  pinned: boolean;
  status: PendingActivationAllocationStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    channel: string,
    utmSource: string,
    priority: number,
    pinned: boolean,
    status: PendingActivationAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.channel = channel;
    this.utmSource = utmSource;
    this.priority = priority;
    this.pinned = pinned;
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

  canMoveTo(next: PendingActivationAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: PendingActivationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending activation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending activation allocation"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.priority - this.capacity) * 100) / 100;
  }

  copy(): PendingActivationAllocation {
    return new PendingActivationAllocation(
      this.code,
      this.title,
      this.capacity,
      this.channel,
      this.utmSource,
      this.priority,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending activation allocation in status open. */
export function newPendingActivationAllocation(code: string, title: string): PendingActivationAllocation {
  return new PendingActivationAllocation(code, title, 0, "", "", 0, false, "open");
}
