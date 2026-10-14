import * as text from "../../../../kit/text.js";

/** Where a nudge forecast is in its life cycle. */
export type NudgeForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A nudge forecast as the nudge team keeps it. */
export class NudgeForecast {
  code: string;
  name: string;
  active: boolean;
  currency: string;
  segment: string;
  attempts: number;
  status: NudgeForecastStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    currency: string,
    segment: string,
    attempts: number,
    status: NudgeForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.currency = currency;
    this.segment = segment;
    this.attempts = attempts;
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

  canMoveTo(next: NudgeForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
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
        return next === "failed";
    }
    return false;
  }

  moveTo(next: NudgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): NudgeForecast {
    return new NudgeForecast(
      this.code,
      this.name,
      this.active,
      this.currency,
      this.segment,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a nudge forecast in status new. */
export function newNudgeForecast(code: string, name: string): NudgeForecast {
  return new NudgeForecast(code, name, false, "", "", 0, "new");
}
