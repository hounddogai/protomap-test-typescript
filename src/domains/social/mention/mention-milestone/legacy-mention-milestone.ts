/**
 * The legacy mention milestone records of social's mention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy mention milestone is in its life cycle. */
export type LegacyMentionMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy mention milestone. Its code is unique within a tenant. */
export class LegacyMentionMilestone {
  code: string;
  label: string;
  batchSize: number;
  audienceId: string;
  checksum: string;
  cohort: string;
  visible: boolean;
  status: LegacyMentionMilestoneStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    audienceId: string,
    checksum: string,
    cohort: string,
    visible: boolean,
    status: LegacyMentionMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.checksum = checksum;
    this.cohort = cohort;
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

  canMoveTo(next: LegacyMentionMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyMentionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy mention milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): LegacyMentionMilestone {
    return new LegacyMentionMilestone(
      this.code,
      this.label,
      this.batchSize,
      this.audienceId,
      this.checksum,
      this.cohort,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy mention milestone in status idle. */
export function newLegacyMentionMilestone(code: string, label: string): LegacyMentionMilestone {
  return new LegacyMentionMilestone(code, label, 0, "", "", "", false, "idle");
}
