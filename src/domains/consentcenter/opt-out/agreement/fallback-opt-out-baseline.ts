import * as text from "../../../../kit/text.js";

/** Where a fallback opt out baseline is in its life cycle. */
export type FallbackOptOutBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback opt out baseline. Its code is unique within a tenant. */
export class FallbackOptOutBaseline {
  code: string;
  label: string;
  durationMinutes: number;
  attempts: number;
  channel: string;
  status: FallbackOptOutBaselineStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    attempts: number,
    channel: string,
    status: FallbackOptOutBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
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

  canMoveTo(next: FallbackOptOutBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: FallbackOptOutBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback opt out baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback opt out baseline"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.durationMinutes * this.attempts * 100) / 100;
  }

  copy(): FallbackOptOutBaseline {
    return new FallbackOptOutBaseline(
      this.code,
      this.label,
      this.durationMinutes,
      this.attempts,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback opt out baseline in status open. */
export function newFallbackOptOutBaseline(code: string, label: string): FallbackOptOutBaseline {
  return new FallbackOptOutBaseline(code, label, 0, 0, "", "open");
}
