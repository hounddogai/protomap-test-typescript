import * as text from "../../../../kit/text.js";

/** Where a global step cycle is in its life cycle. */
export type GlobalStepCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a global step cycle and its current status. */
export class GlobalStepCycle {
  code: string;
  label: string;
  active: boolean;
  score: number;
  visible: boolean;
  status: GlobalStepCycleStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    score: number,
    visible: boolean,
    status: GlobalStepCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.score = score;
    this.visible = visible;
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

  canMoveTo(next: GlobalStepCycleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalStepCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global step cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): GlobalStepCycle {
    return new GlobalStepCycle(this.code, this.label, this.active, this.score, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global step cycle in status open. */
export function newGlobalStepCycle(code: string, label: string): GlobalStepCycle {
  return new GlobalStepCycle(code, label, false, 0, false, "open");
}
