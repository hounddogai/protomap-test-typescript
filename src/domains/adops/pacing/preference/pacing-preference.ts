/**
 * The pacing preference records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing preference is in its life cycle. */
export type PacingPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pacing preference. Its code is unique within a tenant. */
export class PacingPreference {
  code: string;
  name: string;
  channel: string;
  limit: number;
  budget: number;
  archived: boolean;
  sendAt: number;
  title: string;
  timezone: string;
  status: PacingPreferenceStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    limit: number,
    budget: number,
    archived: boolean,
    sendAt: number,
    title: string,
    timezone: string,
    status: PacingPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.limit = limit;
    this.budget = budget;
    this.archived = archived;
    this.sendAt = sendAt;
    this.title = title;
    this.timezone = timezone;
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

  canMoveTo(next: PacingPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: PacingPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pacing preference"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.budget + this.sendAt) * 100) / 100;
  }

  copy(): PacingPreference {
    return new PacingPreference(
      this.code,
      this.name,
      this.channel,
      this.limit,
      this.budget,
      this.archived,
      this.sendAt,
      this.title,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pacing preference in status idle. */
export function newPacingPreference(code: string, name: string): PacingPreference {
  return new PacingPreference(code, name, "", 0, 0, false, 0, "", "", "idle");
}
