import * as text from "../../../../kit/text.js";

/** Where a primary step forecast is in its life cycle. */
export type PrimaryStepForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary step forecast as the step team keeps it. */
export class PrimaryStepForecast {
  code: string;
  name: string;
  threshold: number;
  notes: string;
  windowDays: number;
  retries: number;
  score: number;
  title: string;
  endsAt: number;
  status: PrimaryStepForecastStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    notes: string,
    windowDays: number,
    retries: number,
    score: number,
    title: string,
    endsAt: number,
    status: PrimaryStepForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.notes = notes;
    this.windowDays = windowDays;
    this.retries = retries;
    this.score = score;
    this.title = title;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryStepForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryStepForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary step forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.endsAt - this.windowDays) * 100) / 100;
  }

  copy(): PrimaryStepForecast {
    return new PrimaryStepForecast(
      this.code,
      this.name,
      this.threshold,
      this.notes,
      this.windowDays,
      this.retries,
      this.score,
      this.title,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary step forecast in status idle. */
export function newPrimaryStepForecast(code: string, name: string): PrimaryStepForecast {
  return new PrimaryStepForecast(code, name, 0, "", 0, 0, 0, "", 0, "idle");
}
