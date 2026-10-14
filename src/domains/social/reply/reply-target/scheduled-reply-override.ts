import * as text from "../../../../kit/text.js";

/** Where a scheduled reply override is in its life cycle. */
export type ScheduledReplyOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled reply override. Its code is unique within a tenant. */
export class ScheduledReplyOverride {
  code: string;
  label: string;
  visible: boolean;
  budget: number;
  version: number;
  campaignRef: string;
  status: ScheduledReplyOverrideStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    budget: number,
    version: number,
    campaignRef: string,
    status: ScheduledReplyOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.budget = budget;
    this.version = version;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ScheduledReplyOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready";
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

  moveTo(next: ScheduledReplyOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reply override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"scheduled reply override"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.version - this.budget) * 100) / 100;
  }

  copy(): ScheduledReplyOverride {
    return new ScheduledReplyOverride(
      this.code,
      this.label,
      this.visible,
      this.budget,
      this.version,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled reply override in status idle. */
export function newScheduledReplyOverride(code: string, label: string): ScheduledReplyOverride {
  return new ScheduledReplyOverride(code, label, false, 0, 0, "", "idle");
}
