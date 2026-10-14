/**
 * The regional post proposal records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional post proposal is in its life cycle. */
export type RegionalPostProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional post proposal as the post team keeps it. */
export class RegionalPostProposal {
  code: string;
  label: string;
  weight: number;
  frequencyCap: number;
  updatedAt: number;
  windowDays: number;
  title: string;
  status: RegionalPostProposalStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    frequencyCap: number,
    updatedAt: number,
    windowDays: number,
    title: string,
    status: RegionalPostProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.title = title;
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

  canMoveTo(next: RegionalPostProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalPostProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional post proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional post proposal"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.weight + this.updatedAt) * 100) / 100;
  }

  copy(): RegionalPostProposal {
    return new RegionalPostProposal(
      this.code,
      this.label,
      this.weight,
      this.frequencyCap,
      this.updatedAt,
      this.windowDays,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional post proposal in status idle. */
export function newRegionalPostProposal(code: string, label: string): RegionalPostProposal {
  return new RegionalPostProposal(code, label, 0, 0, 0, 0, "", "idle");
}
