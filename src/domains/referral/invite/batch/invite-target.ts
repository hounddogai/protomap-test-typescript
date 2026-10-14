import * as text from "../../../../kit/text.js";

/** Where a invite target is in its life cycle. */
export type InviteTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A invite target as the invite team keeps it. */
export class InviteTarget {
  code: string;
  label: string;
  utmSource: string;
  priority: number;
  discount: number;
  windowDays: number;
  version: number;
  status: InviteTargetStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    priority: number,
    discount: number,
    windowDays: number,
    version: number,
    status: InviteTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.priority = priority;
    this.discount = discount;
    this.windowDays = windowDays;
    this.version = version;
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

  canMoveTo(next: InviteTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
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

  moveTo(next: InviteTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.version * this.priority * 100) / 100;
  }

  copy(): InviteTarget {
    return new InviteTarget(
      this.code,
      this.label,
      this.utmSource,
      this.priority,
      this.discount,
      this.windowDays,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a invite target in status new. */
export function newInviteTarget(code: string, label: string): InviteTarget {
  return new InviteTarget(code, label, "", 0, 0, 0, 0, "new");
}
