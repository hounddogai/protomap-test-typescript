import * as text from "../../../../kit/text.js";

/** Where a capped complaint target is in its life cycle. */
export type CappedComplaintTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped complaint target. Its code is unique within a tenant. */
export class CappedComplaintTarget {
  code: string;
  name: string;
  endsAt: number;
  sequence: number;
  capacity: number;
  locale: string;
  visible: boolean;
  graceDays: number;
  updatedAt: number;
  status: CappedComplaintTargetStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    sequence: number,
    capacity: number,
    locale: string,
    visible: boolean,
    graceDays: number,
    updatedAt: number,
    status: CappedComplaintTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.capacity = capacity;
    this.locale = locale;
    this.visible = visible;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedComplaintTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedComplaintTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped complaint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedValue(): number {
    return Math.round((this.sequence + this.capacity) * 100) / 100;
  }

  copy(): CappedComplaintTarget {
    return new CappedComplaintTarget(
      this.code,
      this.name,
      this.endsAt,
      this.sequence,
      this.capacity,
      this.locale,
      this.visible,
      this.graceDays,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped complaint target in status proposed. */
export function newCappedComplaintTarget(code: string, name: string): CappedComplaintTarget {
  return new CappedComplaintTarget(code, name, 0, 0, 0, "", false, 0, 0, "proposed");
}
