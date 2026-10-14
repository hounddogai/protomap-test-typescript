import * as text from "../../../../kit/text.js";

/** Where a opt out cycle is in its life cycle. */
export type OptOutCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** A opt out cycle as the opt out team keeps it. */
export class OptOutCycle {
  code: string;
  title: string;
  timezone: string;
  sequence: number;
  startsAt: number;
  summary: string;
  pinned: boolean;
  visible: boolean;
  margin: number;
  source: string;
  status: OptOutCycleStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    sequence: number,
    startsAt: number,
    summary: string,
    pinned: boolean,
    visible: boolean,
    margin: number,
    source: string,
    status: OptOutCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.summary = summary;
    this.pinned = pinned;
    this.visible = visible;
    this.margin = margin;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: OptOutCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"opt out cycle"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.startsAt + this.margin) * 100) / 100;
  }

  copy(): OptOutCycle {
    return new OptOutCycle(
      this.code,
      this.title,
      this.timezone,
      this.sequence,
      this.startsAt,
      this.summary,
      this.pinned,
      this.visible,
      this.margin,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a opt out cycle in status requested. */
export function newOptOutCycle(code: string, title: string): OptOutCycle {
  return new OptOutCycle(code, title, "", 0, 0, "", false, false, 0, "", "requested");
}
