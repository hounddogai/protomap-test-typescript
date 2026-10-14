import * as text from "../../../../kit/text.js";

/** Where a manual flight checkpoint is in its life cycle. */
export type ManualFlightCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual flight checkpoint as the flight team keeps it. */
export class ManualFlightCheckpoint {
  code: string;
  title: string;
  timezone: string;
  approved: boolean;
  contactEmail: string;
  campaignRef: string;
  durationMinutes: number;
  status: ManualFlightCheckpointStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    approved: boolean,
    contactEmail: string,
    campaignRef: string,
    durationMinutes: number,
    status: ManualFlightCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ManualFlightCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualFlightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual flight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): ManualFlightCheckpoint {
    return new ManualFlightCheckpoint(
      this.code,
      this.title,
      this.timezone,
      this.approved,
      this.contactEmail,
      this.campaignRef,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual flight checkpoint in status idle. */
export function newManualFlightCheckpoint(code: string, title: string): ManualFlightCheckpoint {
  return new ManualFlightCheckpoint(code, title, "", false, "", "", 0, "idle");
}
