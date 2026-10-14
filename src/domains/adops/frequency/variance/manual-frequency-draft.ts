import * as text from "../../../../kit/text.js";

/** Where a manual frequency draft is in its life cycle. */
export type ManualFrequencyDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a manual frequency draft and its current status. */
export class ManualFrequencyDraft {
  code: string;
  title: string;
  budget: number;
  checksum: string;
  name: string;
  bid: number;
  status: ManualFrequencyDraftStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    checksum: string,
    name: string,
    bid: number,
    status: ManualFrequencyDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.checksum = checksum;
    this.name = name;
    this.bid = bid;
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

  canMoveTo(next: ManualFrequencyDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: ManualFrequencyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual frequency draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.budget + this.bid) * 100) / 100;
  }

  copy(): ManualFrequencyDraft {
    return new ManualFrequencyDraft(
      this.code,
      this.title,
      this.budget,
      this.checksum,
      this.name,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual frequency draft in status idle. */
export function newManualFrequencyDraft(code: string, title: string): ManualFrequencyDraft {
  return new ManualFrequencyDraft(code, title, 0, "", "", 0, "idle");
}
