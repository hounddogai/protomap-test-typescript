import * as text from "../../../../kit/text.js";

/** Where a default preference policy is in its life cycle. */
export type DefaultPreferencePolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a default preference policy and its current status. */
export class DefaultPreferencePolicy {
  code: string;
  title: string;
  capacity: number;
  checksum: string;
  audienceId: string;
  unit: string;
  endsAt: number;
  active: boolean;
  status: DefaultPreferencePolicyStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    checksum: string,
    audienceId: string,
    unit: string,
    endsAt: number,
    active: boolean,
    status: DefaultPreferencePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.unit = unit;
    this.endsAt = endsAt;
    this.active = active;
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

  canMoveTo(next: DefaultPreferencePolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: DefaultPreferencePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default preference policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.endsAt + this.capacity) * 100) / 100;
  }

  copy(): DefaultPreferencePolicy {
    return new DefaultPreferencePolicy(
      this.code,
      this.title,
      this.capacity,
      this.checksum,
      this.audienceId,
      this.unit,
      this.endsAt,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default preference policy in status idle. */
export function newDefaultPreferencePolicy(code: string, title: string): DefaultPreferencePolicy {
  return new DefaultPreferencePolicy(code, title, 0, "", "", "", 0, false, "idle");
}
