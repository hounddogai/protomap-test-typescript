import * as text from "../../../../kit/text.js";

/** Where a macro window is in its life cycle. */
export type MacroWindowStatus = "created" | "validated" | "published" | "retired";

/** A macro window as the macro team keeps it. */
export class MacroWindow {
  code: string;
  label: string;
  journeyId: string;
  expiresAt: number;
  rate: number;
  archived: boolean;
  visible: boolean;
  attempts: number;
  campaignRef: string;
  active: boolean;
  bid: number;
  status: MacroWindowStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    expiresAt: number,
    rate: number,
    archived: boolean,
    visible: boolean,
    attempts: number,
    campaignRef: string,
    active: boolean,
    bid: number,
    status: MacroWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.expiresAt = expiresAt;
    this.rate = rate;
    this.archived = archived;
    this.visible = visible;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.active = active;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: MacroWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"macro window"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.attempts * this.rate * 100) / 100;
  }

  copy(): MacroWindow {
    return new MacroWindow(
      this.code,
      this.label,
      this.journeyId,
      this.expiresAt,
      this.rate,
      this.archived,
      this.visible,
      this.attempts,
      this.campaignRef,
      this.active,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro window in status created. */
export function newMacroWindow(code: string, label: string): MacroWindow {
  return new MacroWindow(code, label, "", 0, 0, false, false, 0, "", false, 0, "created");
}
