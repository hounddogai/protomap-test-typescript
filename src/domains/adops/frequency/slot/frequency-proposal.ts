import * as text from "../../../../kit/text.js";

/** Where a frequency proposal is in its life cycle. */
export type FrequencyProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One frequency proposal, with what the planners need to act on it. */
export class FrequencyProposal {
  code: string;
  title: string;
  budget: number;
  name: string;
  floorValue: number;
  active: boolean;
  channel: string;
  tags: string[];
  cohort: string;
  status: FrequencyProposalStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    name: string,
    floorValue: number,
    active: boolean,
    channel: string,
    tags: string[],
    cohort: string,
    status: FrequencyProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.name = name;
    this.floorValue = floorValue;
    this.active = active;
    this.channel = channel;
    this.tags = tags;
    this.cohort = cohort;
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

  canMoveTo(next: FrequencyProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FrequencyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.budget + this.floorValue) * 100) / 100;
  }

  copy(): FrequencyProposal {
    return new FrequencyProposal(
      this.code,
      this.title,
      this.budget,
      this.name,
      this.floorValue,
      this.active,
      this.channel,
      this.tags,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a frequency proposal in status idle. */
export function newFrequencyProposal(code: string, title: string): FrequencyProposal {
  return new FrequencyProposal(code, title, 0, "", 0, false, "", [], "", "idle");
}
