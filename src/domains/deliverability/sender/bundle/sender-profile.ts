import * as text from "../../../../kit/text.js";

/** Where a sender profile is in its life cycle. */
export type SenderProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A sender profile. Its code is unique within a tenant. */
export class SenderProfile {
  code: string;
  label: string;
  segment: string;
  durationMinutes: number;
  sequence: number;
  capacity: number;
  version: number;
  audienceId: string;
  reviewer: string;
  status: SenderProfileStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    durationMinutes: number,
    sequence: number,
    capacity: number,
    version: number,
    audienceId: string,
    reviewer: string,
    status: SenderProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.durationMinutes = durationMinutes;
    this.sequence = sequence;
    this.capacity = capacity;
    this.version = version;
    this.audienceId = audienceId;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedValue(): number {
    return Math.round(this.durationMinutes * this.version * 100) / 100;
  }

  copy(): SenderProfile {
    return new SenderProfile(
      this.code,
      this.label,
      this.segment,
      this.durationMinutes,
      this.sequence,
      this.capacity,
      this.version,
      this.audienceId,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sender profile in status draft. */
export function newSenderProfile(code: string, label: string): SenderProfile {
  return new SenderProfile(code, label, "", 0, 0, 0, 0, "", "", "draft");
}
