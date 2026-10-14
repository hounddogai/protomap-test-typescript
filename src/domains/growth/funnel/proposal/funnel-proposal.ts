/**
 * The funnel proposal records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel proposal is in its life cycle. */
export type FunnelProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a funnel proposal and its current status. */
export class FunnelProposal {
  code: string;
  label: string;
  score: number;
  notes: string;
  updatedAt: number;
  channel: string;
  margin: number;
  durationMinutes: number;
  floorValue: number;
  cohort: string;
  cost: number;
  status: FunnelProposalStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    notes: string,
    updatedAt: number,
    channel: string,
    margin: number,
    durationMinutes: number,
    floorValue: number,
    cohort: string,
    cost: number,
    status: FunnelProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.floorValue = floorValue;
    this.cohort = cohort;
    this.cost = cost;
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

  canMoveTo(next: FunnelProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
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
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.score - this.floorValue) * 100) / 100;
  }

  copy(): FunnelProposal {
    return new FunnelProposal(
      this.code,
      this.label,
      this.score,
      this.notes,
      this.updatedAt,
      this.channel,
      this.margin,
      this.durationMinutes,
      this.floorValue,
      this.cohort,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a funnel proposal in status idle. */
export function newFunnelProposal(code: string, label: string): FunnelProposal {
  return new FunnelProposal(code, label, 0, "", 0, "", 0, 0, 0, "", 0, "idle");
}
