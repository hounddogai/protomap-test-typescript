import * as text from "../../../../kit/text.js";

/** Where a macro policy is in its life cycle. */
export type MacroPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One macro policy, with what the planners need to act on it. */
export class MacroPolicy {
  code: string;
  title: string;
  frequencyCap: number;
  visible: boolean;
  journeyId: string;
  priority: number;
  score: number;
  cost: number;
  variant: string;
  status: MacroPolicyStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    visible: boolean,
    journeyId: string,
    priority: number,
    score: number,
    cost: number,
    variant: string,
    status: MacroPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.journeyId = journeyId;
    this.priority = priority;
    this.score = score;
    this.cost = cost;
    this.variant = variant;
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

  canMoveTo(next: MacroPolicyStatus): boolean {
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.cost + this.priority) * 100) / 100;
  }

  copy(): MacroPolicy {
    return new MacroPolicy(
      this.code,
      this.title,
      this.frequencyCap,
      this.visible,
      this.journeyId,
      this.priority,
      this.score,
      this.cost,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a macro policy in status proposed. */
export function newMacroPolicy(code: string, title: string): MacroPolicy {
  return new MacroPolicy(code, title, 0, false, "", 0, 0, 0, "", "proposed");
}
