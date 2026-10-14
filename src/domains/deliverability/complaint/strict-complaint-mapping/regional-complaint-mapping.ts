/**
 * The regional complaint mapping records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional complaint mapping is in its life cycle. */
export type RegionalComplaintMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional complaint mapping. Its code is unique within a tenant. */
export class RegionalComplaintMapping {
  code: string;
  name: string;
  discount: number;
  notes: string;
  channel: string;
  description: string;
  summary: string;
  archived: boolean;
  sequence: number;
  journeyId: string;
  threshold: number;
  status: RegionalComplaintMappingStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    notes: string,
    channel: string,
    description: string,
    summary: string,
    archived: boolean,
    sequence: number,
    journeyId: string,
    threshold: number,
    status: RegionalComplaintMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.notes = notes;
    this.channel = channel;
    this.description = description;
    this.summary = summary;
    this.archived = archived;
    this.sequence = sequence;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalComplaintMappingStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalComplaintMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional complaint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round(this.discount * this.threshold * 100) / 100;
  }

  copy(): RegionalComplaintMapping {
    return new RegionalComplaintMapping(
      this.code,
      this.name,
      this.discount,
      this.notes,
      this.channel,
      this.description,
      this.summary,
      this.archived,
      this.sequence,
      this.journeyId,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional complaint mapping in status new. */
export function newRegionalComplaintMapping(code: string, name: string): RegionalComplaintMapping {
  return new RegionalComplaintMapping(code, name, 0, "", "", "", "", false, 0, "", 0, "new");
}
