import * as text from "../../../../kit/text.js";

/** Where a legacy pacing agreement is in its life cycle. */
export type LegacyPacingAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a legacy pacing agreement and its current status. */
export class LegacyPacingAgreement {
  code: string;
  title: string;
  name: string;
  archived: boolean;
  summary: string;
  weight: number;
  description: string;
  startsAt: number;
  segment: string;
  status: LegacyPacingAgreementStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    archived: boolean,
    summary: string,
    weight: number,
    description: string,
    startsAt: number,
    segment: string,
    status: LegacyPacingAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.archived = archived;
    this.summary = summary;
    this.weight = weight;
    this.description = description;
    this.startsAt = startsAt;
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

  canMoveTo(next: LegacyPacingAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "draining";
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

  moveTo(next: LegacyPacingAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy pacing agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy pacing agreement"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.startsAt * this.weight * 100) / 100;
  }

  copy(): LegacyPacingAgreement {
    return new LegacyPacingAgreement(
      this.code,
      this.title,
      this.name,
      this.archived,
      this.summary,
      this.weight,
      this.description,
      this.startsAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy pacing agreement in status idle. */
export function newLegacyPacingAgreement(code: string, title: string): LegacyPacingAgreement {
  return new LegacyPacingAgreement(code, title, "", false, "", 0, "", 0, "", "idle");
}
