/**
 * The batched step proposal records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched step proposal is in its life cycle. */
export type BatchedStepProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched step proposal. Its code is unique within a tenant. */
export class BatchedStepProposal {
  code: string;
  name: string;
  country: string;
  summary: string;
  frequencyCap: number;
  segment: string;
  graceDays: number;
  priority: number;
  margin: number;
  status: BatchedStepProposalStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    summary: string,
    frequencyCap: number,
    segment: string,
    graceDays: number,
    priority: number,
    margin: number,
    status: BatchedStepProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.summary = summary;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.graceDays = graceDays;
    this.priority = priority;
    this.margin = margin;
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

  canMoveTo(next: BatchedStepProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining";
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

  moveTo(next: BatchedStepProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched step proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.priority * this.frequencyCap * 100) / 100;
  }

  copy(): BatchedStepProposal {
    return new BatchedStepProposal(
      this.code,
      this.name,
      this.country,
      this.summary,
      this.frequencyCap,
      this.segment,
      this.graceDays,
      this.priority,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched step proposal in status idle. */
export function newBatchedStepProposal(code: string, name: string): BatchedStepProposal {
  return new BatchedStepProposal(code, name, "", "", 0, "", 0, 0, 0, "idle");
}
