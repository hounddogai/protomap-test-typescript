/**
 * The pacing proposal records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing proposal is in its life cycle. */
export type PacingProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pacing proposal as the pacing team keeps it. */
export class PacingProposal {
  code: string;
  label: string;
  durationMinutes: number;
  visible: boolean;
  locale: string;
  frequencyCap: number;
  cohort: string;
  active: boolean;
  pinned: boolean;
  status: PacingProposalStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    visible: boolean,
    locale: string,
    frequencyCap: number,
    cohort: string,
    active: boolean,
    pinned: boolean,
    status: PacingProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.cohort = cohort;
    this.active = active;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PacingProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round(this.durationMinutes * this.frequencyCap * 100) / 100;
  }

  copy(): PacingProposal {
    return new PacingProposal(
      this.code,
      this.label,
      this.durationMinutes,
      this.visible,
      this.locale,
      this.frequencyCap,
      this.cohort,
      this.active,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pacing proposal in status planned. */
export function newPacingProposal(code: string, label: string): PacingProposal {
  return new PacingProposal(code, label, 0, false, "", 0, "", false, false, "planned");
}
