import * as text from "../../../../kit/text.js";

/** Where a wait baseline is in its life cycle. */
export type WaitBaselineStatus = "created" | "validated" | "published" | "retired";

/** A wait baseline as the wait team keeps it. */
export class WaitBaseline {
  code: string;
  label: string;
  cost: number;
  active: boolean;
  ratio: number;
  expiresAt: number;
  timezone: string;
  audienceId: string;
  utmSource: string;
  status: WaitBaselineStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    active: boolean,
    ratio: number,
    expiresAt: number,
    timezone: string,
    audienceId: string,
    utmSource: string,
    status: WaitBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.active = active;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WaitBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.ratio + this.cost) * 100) / 100;
  }

  copy(): WaitBaseline {
    return new WaitBaseline(
      this.code,
      this.label,
      this.cost,
      this.active,
      this.ratio,
      this.expiresAt,
      this.timezone,
      this.audienceId,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a wait baseline in status created. */
export function newWaitBaseline(code: string, label: string): WaitBaseline {
  return new WaitBaseline(code, label, 0, false, 0, 0, "", "", "", "created");
}
