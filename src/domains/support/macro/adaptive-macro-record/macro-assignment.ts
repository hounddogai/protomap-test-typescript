import * as text from "../../../../kit/text.js";

/** Where a macro assignment is in its life cycle. */
export type MacroAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a macro assignment and its current status. */
export class MacroAssignment {
  code: string;
  label: string;
  endsAt: number;
  windowDays: number;
  unit: string;
  channel: string;
  status: MacroAssignmentStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    windowDays: number,
    unit: string,
    channel: string,
    status: MacroAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
    this.unit = unit;
    this.channel = channel;
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

  canMoveTo(next: MacroAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: MacroAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"macro assignment"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt + this.windowDays) * 100) / 100;
  }

  copy(): MacroAssignment {
    return new MacroAssignment(
      this.code,
      this.label,
      this.endsAt,
      this.windowDays,
      this.unit,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a macro assignment in status open. */
export function newMacroAssignment(code: string, label: string): MacroAssignment {
  return new MacroAssignment(code, label, 0, 0, "", "", "open");
}
