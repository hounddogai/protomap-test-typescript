import * as text from "../../../../kit/text.js";

/** Where a csat exception is in its life cycle. */
export type CsatExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A csat exception. Its code is unique within a tenant. */
export class CsatException {
  code: string;
  title: string;
  priority: number;
  channel: string;
  checksum: string;
  approved: boolean;
  unit: string;
  status: CsatExceptionStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    channel: string,
    checksum: string,
    approved: boolean,
    unit: string,
    status: CsatExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.channel = channel;
    this.checksum = checksum;
    this.approved = approved;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): CsatException {
    return new CsatException(
      this.code,
      this.title,
      this.priority,
      this.channel,
      this.checksum,
      this.approved,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a csat exception in status planned. */
export function newCsatException(code: string, title: string): CsatException {
  return new CsatException(code, title, 0, "", "", false, "", "planned");
}
