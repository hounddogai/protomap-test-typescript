/**
 * The pending opt out template records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending opt out template is in its life cycle. */
export type PendingOptOutTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending opt out template as the opt out team keeps it. */
export class PendingOptOutTemplate {
  code: string;
  name: string;
  maximum: number;
  floorValue: number;
  variant: string;
  notes: string;
  phone: string;
  status: PendingOptOutTemplateStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    floorValue: number,
    variant: string,
    notes: string,
    phone: string,
    status: PendingOptOutTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.variant = variant;
    this.notes = notes;
    this.phone = phone;
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

  canMoveTo(next: PendingOptOutTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingOptOutTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending opt out template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.maximum * this.floorValue * 100) / 100;
  }

  copy(): PendingOptOutTemplate {
    return new PendingOptOutTemplate(
      this.code,
      this.name,
      this.maximum,
      this.floorValue,
      this.variant,
      this.notes,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending opt out template in status idle. */
export function newPendingOptOutTemplate(code: string, name: string): PendingOptOutTemplate {
  return new PendingOptOutTemplate(code, name, 0, 0, "", "", "", "idle");
}
