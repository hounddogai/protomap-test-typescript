import * as text from "../../../../kit/text.js";

/** Where a legacy warmup window is in its life cycle. */
export type LegacyWarmupWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a legacy warmup window and its current status. */
export class LegacyWarmupWindow {
  code: string;
  name: string;
  priority: number;
  reviewer: string;
  visible: boolean;
  threshold: number;
  endsAt: number;
  status: LegacyWarmupWindowStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    reviewer: string,
    visible: boolean,
    threshold: number,
    endsAt: number,
    status: LegacyWarmupWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.reviewer = reviewer;
    this.visible = visible;
    this.threshold = threshold;
    this.endsAt = endsAt;
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

  canMoveTo(next: LegacyWarmupWindowStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
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

  moveTo(next: LegacyWarmupWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy warmup window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy warmup window"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.endsAt * this.priority * 100) / 100;
  }

  copy(): LegacyWarmupWindow {
    return new LegacyWarmupWindow(
      this.code,
      this.name,
      this.priority,
      this.reviewer,
      this.visible,
      this.threshold,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy warmup window in status open. */
export function newLegacyWarmupWindow(code: string, name: string): LegacyWarmupWindow {
  return new LegacyWarmupWindow(code, name, 0, "", false, 0, 0, "open");
}
