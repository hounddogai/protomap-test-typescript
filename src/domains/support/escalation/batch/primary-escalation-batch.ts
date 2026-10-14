/**
 * The primary escalation batch records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary escalation batch is in its life cycle. */
export type PrimaryEscalationBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary escalation batch as the escalation team keeps it. */
export class PrimaryEscalationBatch {
  code: string;
  title: string;
  segment: string;
  threshold: number;
  visible: boolean;
  utmSource: string;
  durationMinutes: number;
  notes: string;
  checksum: string;
  status: PrimaryEscalationBatchStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    threshold: number,
    visible: boolean,
    utmSource: string,
    durationMinutes: number,
    notes: string,
    checksum: string,
    status: PrimaryEscalationBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.threshold = threshold;
    this.visible = visible;
    this.utmSource = utmSource;
    this.durationMinutes = durationMinutes;
    this.notes = notes;
    this.checksum = checksum;
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

  canMoveTo(next: PrimaryEscalationBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryEscalationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary escalation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.threshold * this.durationMinutes * 100) / 100;
  }

  copy(): PrimaryEscalationBatch {
    return new PrimaryEscalationBatch(
      this.code,
      this.title,
      this.segment,
      this.threshold,
      this.visible,
      this.utmSource,
      this.durationMinutes,
      this.notes,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary escalation batch in status idle. */
export function newPrimaryEscalationBatch(code: string, title: string): PrimaryEscalationBatch {
  return new PrimaryEscalationBatch(code, title, "", 0, false, "", 0, "", "", "idle");
}
