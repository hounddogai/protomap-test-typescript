/**
 * The nudge manifest records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge manifest is in its life cycle. */
export type NudgeManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A nudge manifest. Its code is unique within a tenant. */
export class NudgeManifest {
  code: string;
  label: string;
  active: boolean;
  updatedAt: number;
  cost: number;
  budget: number;
  channel: string;
  status: NudgeManifestStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    updatedAt: number,
    cost: number,
    budget: number,
    channel: string,
    status: NudgeManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.updatedAt = updatedAt;
    this.cost = cost;
    this.budget = budget;
    this.channel = channel;
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

  canMoveTo(next: NudgeManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: NudgeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.updatedAt + this.budget) * 100) / 100;
  }

  copy(): NudgeManifest {
    return new NudgeManifest(
      this.code,
      this.label,
      this.active,
      this.updatedAt,
      this.cost,
      this.budget,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a nudge manifest in status idle. */
export function newNudgeManifest(code: string, label: string): NudgeManifest {
  return new NudgeManifest(code, label, false, 0, 0, 0, "", "idle");
}
