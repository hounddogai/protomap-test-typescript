import * as text from "../../../../kit/text.js";

/** Where a csat milestone is in its life cycle. */
export type CsatMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a csat milestone and its current status. */
export class CsatMilestone {
  code: string;
  title: string;
  externalRef: string;
  journeyId: string;
  audienceId: string;
  floorValue: number;
  endsAt: number;
  score: number;
  rate: number;
  frequencyCap: number;
  segment: string;
  status: CsatMilestoneStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    journeyId: string,
    audienceId: string,
    floorValue: number,
    endsAt: number,
    score: number,
    rate: number,
    frequencyCap: number,
    segment: string,
    status: CsatMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.endsAt = endsAt;
    this.score = score;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
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

  canMoveTo(next: CsatMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
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
        switch (next) {
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

  moveTo(next: CsatMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"csat milestone"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.score + this.floorValue) * 100) / 100;
  }

  copy(): CsatMilestone {
    return new CsatMilestone(
      this.code,
      this.title,
      this.externalRef,
      this.journeyId,
      this.audienceId,
      this.floorValue,
      this.endsAt,
      this.score,
      this.rate,
      this.frequencyCap,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a csat milestone in status idle. */
export function newCsatMilestone(code: string, title: string): CsatMilestone {
  return new CsatMilestone(code, title, "", "", "", 0, 0, 0, 0, 0, "", "idle");
}
