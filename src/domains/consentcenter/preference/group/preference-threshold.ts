import * as text from "../../../../kit/text.js";

/** Where a preference threshold is in its life cycle. */
export type PreferenceThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A preference threshold. Its code is unique within a tenant. */
export class PreferenceThreshold {
  code: string;
  label: string;
  ownerId: string;
  version: number;
  priority: number;
  timezone: string;
  status: PreferenceThresholdStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    version: number,
    priority: number,
    timezone: string,
    status: PreferenceThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.version = version;
    this.priority = priority;
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

  canMoveTo(next: PreferenceThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PreferenceThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"preference threshold"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.priority + this.version) * 100) / 100;
  }

  copy(): PreferenceThreshold {
    return new PreferenceThreshold(
      this.code,
      this.label,
      this.ownerId,
      this.version,
      this.priority,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference threshold in status idle. */
export function newPreferenceThreshold(code: string, label: string): PreferenceThreshold {
  return new PreferenceThreshold(code, label, "", 0, 0, "", "idle");
}
