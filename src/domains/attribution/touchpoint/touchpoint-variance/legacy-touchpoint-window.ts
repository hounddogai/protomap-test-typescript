import * as text from "../../../../kit/text.js";

/** Where a legacy touchpoint window is in its life cycle. */
export type LegacyTouchpointWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy touchpoint window, with what the planners need to act on it. */
export class LegacyTouchpointWindow {
  code: string;
  name: string;
  visible: boolean;
  openRate: number;
  budget: number;
  margin: number;
  status: LegacyTouchpointWindowStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    openRate: number,
    budget: number,
    margin: number,
    status: LegacyTouchpointWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.openRate = openRate;
    this.budget = budget;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyTouchpointWindowStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyTouchpointWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy touchpoint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.budget) * 100) / 100;
  }

  copy(): LegacyTouchpointWindow {
    return new LegacyTouchpointWindow(
      this.code,
      this.name,
      this.visible,
      this.openRate,
      this.budget,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy touchpoint window in status new. */
export function newLegacyTouchpointWindow(code: string, name: string): LegacyTouchpointWindow {
  return new LegacyTouchpointWindow(code, name, false, 0, 0, 0, "new");
}
