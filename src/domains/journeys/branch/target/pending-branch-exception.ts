import * as text from "../../../../kit/text.js";

/** Where a pending branch exception is in its life cycle. */
export type PendingBranchExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending branch exception as the branch team keeps it. */
export class PendingBranchException {
  code: string;
  title: string;
  capacity: number;
  name: string;
  checksum: string;
  graceDays: number;
  weight: number;
  startsAt: number;
  margin: number;
  status: PendingBranchExceptionStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    name: string,
    checksum: string,
    graceDays: number,
    weight: number,
    startsAt: number,
    margin: number,
    status: PendingBranchExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.name = name;
    this.checksum = checksum;
    this.graceDays = graceDays;
    this.weight = weight;
    this.startsAt = startsAt;
    this.margin = margin;
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

  canMoveTo(next: PendingBranchExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
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
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingBranchExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending branch exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending branch exception"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.capacity - this.margin) * 100) / 100;
  }

  copy(): PendingBranchException {
    return new PendingBranchException(
      this.code,
      this.title,
      this.capacity,
      this.name,
      this.checksum,
      this.graceDays,
      this.weight,
      this.startsAt,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending branch exception in status open. */
export function newPendingBranchException(code: string, title: string): PendingBranchException {
  return new PendingBranchException(code, title, 0, "", "", 0, 0, 0, 0, "open");
}
