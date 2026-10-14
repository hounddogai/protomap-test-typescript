import * as text from "../../../../kit/text.js";

/** Where a reputation window is in its life cycle. */
export type ReputationWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reputation window. Its code is unique within a tenant. */
export class ReputationWindow {
  code: string;
  label: string;
  clicks: number;
  summary: string;
  utmSource: string;
  status: ReputationWindowStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    summary: string,
    utmSource: string,
    status: ReputationWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.summary = summary;
    this.utmSource = utmSource;
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

  canMoveTo(next: ReputationWindowStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ReputationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): ReputationWindow {
    return new ReputationWindow(this.code, this.label, this.clicks, this.summary, this.utmSource, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a reputation window in status new. */
export function newReputationWindow(code: string, label: string): ReputationWindow {
  return new ReputationWindow(code, label, 0, "", "", "new");
}
