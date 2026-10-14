import * as text from "../../../../kit/text.js";

/** Where a seasonal touchpoint segment is in its life cycle. */
export type SeasonalTouchpointSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a seasonal touchpoint segment and its current status. */
export class SeasonalTouchpointSegment {
  code: string;
  label: string;
  durationMinutes: number;
  source: string;
  frequencyCap: number;
  sendAt: number;
  checksum: string;
  sequence: number;
  status: SeasonalTouchpointSegmentStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    source: string,
    frequencyCap: number,
    sendAt: number,
    checksum: string,
    sequence: number,
    status: SeasonalTouchpointSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.checksum = checksum;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalTouchpointSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalTouchpointSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal touchpoint segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.frequencyCap * this.sendAt * 100) / 100;
  }

  copy(): SeasonalTouchpointSegment {
    return new SeasonalTouchpointSegment(
      this.code,
      this.label,
      this.durationMinutes,
      this.source,
      this.frequencyCap,
      this.sendAt,
      this.checksum,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal touchpoint segment in status requested. */
export function newSeasonalTouchpointSegment(code: string, label: string): SeasonalTouchpointSegment {
  return new SeasonalTouchpointSegment(code, label, 0, "", 0, 0, "", 0, "requested");
}
