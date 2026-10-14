/**
 * The rolling sla window records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling sla window is in its life cycle. */
export type RollingSlaWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One rolling sla window, with what the planners need to act on it. */
export class RollingSlaWindow {
  code: string;
  label: string;
  audienceId: string;
  name: string;
  notes: string;
  amount: number;
  status: RollingSlaWindowStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    name: string,
    notes: string,
    amount: number,
    status: RollingSlaWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.name = name;
    this.notes = notes;
    this.amount = amount;
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

  canMoveTo(next: RollingSlaWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingSlaWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sla window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): RollingSlaWindow {
    return new RollingSlaWindow(
      this.code,
      this.label,
      this.audienceId,
      this.name,
      this.notes,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling sla window in status idle. */
export function newRollingSlaWindow(code: string, label: string): RollingSlaWindow {
  return new RollingSlaWindow(code, label, "", "", "", 0, "idle");
}
