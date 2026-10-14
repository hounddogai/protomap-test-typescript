import * as text from "../../../../kit/text.js";

/** Where a wait cycle is in its life cycle. */
export type WaitCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** A wait cycle as the wait team keeps it. */
export class WaitCycle {
  code: string;
  title: string;
  journeyId: string;
  maximum: number;
  windowDays: number;
  name: string;
  audienceId: string;
  externalRef: string;
  createdAt: number;
  status: WaitCycleStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    maximum: number,
    windowDays: number,
    name: string,
    audienceId: string,
    externalRef: string,
    createdAt: number,
    status: WaitCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.maximum = maximum;
    this.windowDays = windowDays;
    this.name = name;
    this.audienceId = audienceId;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
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

  canMoveTo(next: WaitCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round(this.maximum * this.windowDays * 100) / 100;
  }

  copy(): WaitCycle {
    return new WaitCycle(
      this.code,
      this.title,
      this.journeyId,
      this.maximum,
      this.windowDays,
      this.name,
      this.audienceId,
      this.externalRef,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait cycle in status requested. */
export function newWaitCycle(code: string, title: string): WaitCycle {
  return new WaitCycle(code, title, "", 0, 0, "", "", "", 0, "requested");
}
