import * as text from "../../../../kit/text.js";

/** Where a macro checkpoint is in its life cycle. */
export type MacroCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a macro checkpoint and its current status. */
export class MacroCheckpoint {
  code: string;
  label: string;
  description: string;
  title: string;
  score: number;
  externalRef: string;
  rate: number;
  pinned: boolean;
  discount: number;
  status: MacroCheckpointStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    title: string,
    score: number,
    externalRef: string,
    rate: number,
    pinned: boolean,
    discount: number,
    status: MacroCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.title = title;
    this.score = score;
    this.externalRef = externalRef;
    this.rate = rate;
    this.pinned = pinned;
    this.discount = discount;
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

  canMoveTo(next: MacroCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: MacroCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.rate - this.discount) * 100) / 100;
  }

  copy(): MacroCheckpoint {
    return new MacroCheckpoint(
      this.code,
      this.label,
      this.description,
      this.title,
      this.score,
      this.externalRef,
      this.rate,
      this.pinned,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro checkpoint in status planned. */
export function newMacroCheckpoint(code: string, label: string): MacroCheckpoint {
  return new MacroCheckpoint(code, label, "", "", 0, "", 0, false, 0, "planned");
}
