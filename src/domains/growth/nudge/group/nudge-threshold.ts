import * as text from "../../../../kit/text.js";

/** Where a nudge threshold is in its life cycle. */
export type NudgeThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A nudge threshold. Its code is unique within a tenant. */
export class NudgeThreshold {
  code: string;
  label: string;
  attempts: number;
  locale: string;
  margin: number;
  notes: string;
  cost: number;
  status: NudgeThresholdStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    locale: string,
    margin: number,
    notes: string,
    cost: number,
    status: NudgeThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.locale = locale;
    this.margin = margin;
    this.notes = notes;
    this.cost = cost;
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

  canMoveTo(next: NudgeThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: NudgeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.cost * this.attempts * 100) / 100;
  }

  copy(): NudgeThreshold {
    return new NudgeThreshold(
      this.code,
      this.label,
      this.attempts,
      this.locale,
      this.margin,
      this.notes,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge threshold in status new. */
export function newNudgeThreshold(code: string, label: string): NudgeThreshold {
  return new NudgeThreshold(code, label, 0, "", 0, "", 0, "new");
}
