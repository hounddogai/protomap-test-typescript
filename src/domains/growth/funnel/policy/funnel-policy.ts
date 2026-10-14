/**
 * The funnel policy records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel policy is in its life cycle. */
export type FunnelPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a funnel policy and its current status. */
export class FunnelPolicy {
  code: string;
  name: string;
  priority: number;
  startsAt: number;
  ratio: number;
  sendAt: number;
  notes: string;
  description: string;
  graceDays: number;
  phone: string;
  variant: string;
  status: FunnelPolicyStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    startsAt: number,
    ratio: number,
    sendAt: number,
    notes: string,
    description: string,
    graceDays: number,
    phone: string,
    variant: string,
    status: FunnelPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.sendAt = sendAt;
    this.notes = notes;
    this.description = description;
    this.graceDays = graceDays;
    this.phone = phone;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FunnelPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round(this.graceDays * this.ratio * 100) / 100;
  }

  copy(): FunnelPolicy {
    return new FunnelPolicy(
      this.code,
      this.name,
      this.priority,
      this.startsAt,
      this.ratio,
      this.sendAt,
      this.notes,
      this.description,
      this.graceDays,
      this.phone,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel policy in status new. */
export function newFunnelPolicy(code: string, name: string): FunnelPolicy {
  return new FunnelPolicy(code, name, 0, 0, 0, 0, "", "", 0, "", "", "new");
}
