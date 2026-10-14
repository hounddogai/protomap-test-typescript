import * as text from "../../../../kit/text.js";

/** Where a sender assignment is in its life cycle. */
export type SenderAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A sender assignment as the sender team keeps it. */
export class SenderAssignment {
  code: string;
  name: string;
  country: string;
  version: number;
  capacity: number;
  source: string;
  notes: string;
  status: SenderAssignmentStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    version: number,
    capacity: number,
    source: string,
    notes: string,
    status: SenderAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.version = version;
    this.capacity = capacity;
    this.source = source;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"sender assignment"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.capacity * this.version * 100) / 100;
  }

  copy(): SenderAssignment {
    return new SenderAssignment(
      this.code,
      this.name,
      this.country,
      this.version,
      this.capacity,
      this.source,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a sender assignment in status idle. */
export function newSenderAssignment(code: string, name: string): SenderAssignment {
  return new SenderAssignment(code, name, "", 0, 0, "", "", "idle");
}
