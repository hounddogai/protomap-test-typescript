import * as text from "../../../../kit/text.js";

/** Where a seasonal cohort proposal is in its life cycle. */
export type SeasonalCohortProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal cohort proposal, with what the planners need to act on it. */
export class SeasonalCohortProposal {
  code: string;
  name: string;
  updatedAt: number;
  ratio: number;
  margin: number;
  frequencyCap: number;
  durationMinutes: number;
  retries: number;
  notes: string;
  status: SeasonalCohortProposalStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    ratio: number,
    margin: number,
    frequencyCap: number,
    durationMinutes: number,
    retries: number,
    notes: string,
    status: SeasonalCohortProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.ratio = ratio;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
    this.notes = notes;
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

  canMoveTo(next: SeasonalCohortProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCohortProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal cohort proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.retries + this.frequencyCap) * 100) / 100;
  }

  copy(): SeasonalCohortProposal {
    return new SeasonalCohortProposal(
      this.code,
      this.name,
      this.updatedAt,
      this.ratio,
      this.margin,
      this.frequencyCap,
      this.durationMinutes,
      this.retries,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal cohort proposal in status idle. */
export function newSeasonalCohortProposal(code: string, name: string): SeasonalCohortProposal {
  return new SeasonalCohortProposal(code, name, 0, 0, 0, 0, 0, 0, "", "idle");
}
