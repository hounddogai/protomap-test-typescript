/**
 * The strict model override records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict model override is in its life cycle. */
export type StrictModelOverrideStatus = "created" | "validated" | "published" | "retired";

/** A strict model override as the model team keeps it. */
export class StrictModelOverride {
  code: string;
  title: string;
  ownerId: string;
  graceDays: number;
  channel: string;
  status: StrictModelOverrideStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    graceDays: number,
    channel: string,
    status: StrictModelOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.graceDays = graceDays;
    this.channel = channel;
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

  canMoveTo(next: StrictModelOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictModelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict model override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): StrictModelOverride {
    return new StrictModelOverride(this.code, this.title, this.ownerId, this.graceDays, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict model override in status created. */
export function newStrictModelOverride(code: string, title: string): StrictModelOverride {
  return new StrictModelOverride(code, title, "", 0, "", "created");
}
