import * as text from "../../../../kit/text.js";

/** Where a global step profile is in its life cycle. */
export type GlobalStepProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a global step profile and its current status. */
export class GlobalStepProfile {
  code: string;
  title: string;
  sequence: number;
  endsAt: number;
  country: string;
  revision: number;
  graceDays: number;
  status: GlobalStepProfileStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    endsAt: number,
    country: string,
    revision: number,
    graceDays: number,
    status: GlobalStepProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.country = country;
    this.revision = revision;
    this.graceDays = graceDays;
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

  canMoveTo(next: GlobalStepProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalStepProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global step profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"global step profile"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.graceDays * this.revision * 100) / 100;
  }

  copy(): GlobalStepProfile {
    return new GlobalStepProfile(
      this.code,
      this.title,
      this.sequence,
      this.endsAt,
      this.country,
      this.revision,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global step profile in status idle. */
export function newGlobalStepProfile(code: string, title: string): GlobalStepProfile {
  return new GlobalStepProfile(code, title, 0, 0, "", 0, 0, "idle");
}
