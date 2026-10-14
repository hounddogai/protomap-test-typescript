import * as text from "../../../../kit/text.js";

/** Where a macro slot is in its life cycle. */
export type MacroSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One macro slot, with what the planners need to act on it. */
export class MacroSlot {
  code: string;
  label: string;
  revision: number;
  cohort: string;
  channel: string;
  status: MacroSlotStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    cohort: string,
    channel: string,
    status: MacroSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.cohort = cohort;
    this.channel = channel;
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

  canMoveTo(next: MacroSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: MacroSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"macro slot"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): MacroSlot {
    return new MacroSlot(this.code, this.label, this.revision, this.cohort, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a macro slot in status proposed. */
export function newMacroSlot(code: string, label: string): MacroSlot {
  return new MacroSlot(code, label, 0, "", "", "proposed");
}
