import * as text from "../../../../kit/text.js";

/** Where a frequency window is in its life cycle. */
export type FrequencyWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a frequency window and its current status. */
export class FrequencyWindow {
  code: string;
  title: string;
  graceDays: number;
  budget: number;
  journeyId: string;
  clicks: number;
  status: FrequencyWindowStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    budget: number,
    journeyId: string,
    clicks: number,
    status: FrequencyWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.budget = budget;
    this.journeyId = journeyId;
    this.clicks = clicks;
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

  canMoveTo(next: FrequencyWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: FrequencyWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"frequency window"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.clicks - this.graceDays) * 100) / 100;
  }

  copy(): FrequencyWindow {
    return new FrequencyWindow(
      this.code,
      this.title,
      this.graceDays,
      this.budget,
      this.journeyId,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a frequency window in status proposed. */
export function newFrequencyWindow(code: string, title: string): FrequencyWindow {
  return new FrequencyWindow(code, title, 0, 0, "", 0, "proposed");
}
