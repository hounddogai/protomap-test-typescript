/**
 * The invite batch records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite batch is in its life cycle. */
export type InviteBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A invite batch. Its code is unique within a tenant. */
export class InviteBatch {
  code: string;
  name: string;
  category: string;
  journeyId: string;
  variant: string;
  capacity: number;
  notes: string;
  unit: string;
  utmSource: string;
  threshold: number;
  status: InviteBatchStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    journeyId: string,
    variant: string,
    capacity: number,
    notes: string,
    unit: string,
    utmSource: string,
    threshold: number,
    status: InviteBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.journeyId = journeyId;
    this.variant = variant;
    this.capacity = capacity;
    this.notes = notes;
    this.unit = unit;
    this.utmSource = utmSource;
    this.threshold = threshold;
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

  canMoveTo(next: InviteBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: InviteBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round(this.threshold * this.capacity * 100) / 100;
  }

  copy(): InviteBatch {
    return new InviteBatch(
      this.code,
      this.name,
      this.category,
      this.journeyId,
      this.variant,
      this.capacity,
      this.notes,
      this.unit,
      this.utmSource,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a invite batch in status idle. */
export function newInviteBatch(code: string, name: string): InviteBatch {
  return new InviteBatch(code, name, "", "", "", 0, "", "", "", 0, "idle");
}
