import * as text from "../../../../kit/text.js";

/** Where a rolling step entry is in its life cycle. */
export type RollingStepEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling step entry as the step team keeps it. */
export class RollingStepEntry {
  code: string;
  title: string;
  timezone: string;
  name: string;
  variant: string;
  quantity: number;
  status: RollingStepEntryStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    name: string,
    variant: string,
    quantity: number,
    status: RollingStepEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.name = name;
    this.variant = variant;
    this.quantity = quantity;
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

  canMoveTo(next: RollingStepEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: RollingStepEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): RollingStepEntry {
    return new RollingStepEntry(
      this.code,
      this.title,
      this.timezone,
      this.name,
      this.variant,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling step entry in status planned. */
export function newRollingStepEntry(code: string, title: string): RollingStepEntry {
  return new RollingStepEntry(code, title, "", "", "", 0, "planned");
}
