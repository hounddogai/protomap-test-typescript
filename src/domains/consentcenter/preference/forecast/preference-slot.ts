import * as text from "../../../../kit/text.js";

/** Where a preference slot is in its life cycle. */
export type PreferenceSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One preference slot, with what the planners need to act on it. */
export class PreferenceSlot {
  code: string;
  name: string;
  attempts: number;
  limit: number;
  visible: boolean;
  status: PreferenceSlotStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    limit: number,
    visible: boolean,
    status: PreferenceSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.limit = limit;
    this.visible = visible;
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

  canMoveTo(next: PreferenceSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
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

  moveTo(next: PreferenceSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedLoad(): number {
    return Math.round((this.limit + this.attempts) * 100) / 100;
  }

  copy(): PreferenceSlot {
    return new PreferenceSlot(this.code, this.name, this.attempts, this.limit, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference slot in status idle. */
export function newPreferenceSlot(code: string, name: string): PreferenceSlot {
  return new PreferenceSlot(code, name, 0, 0, false, "idle");
}
