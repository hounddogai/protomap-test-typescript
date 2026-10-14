import * as text from "../../../../kit/text.js";

/** Where a sla record is in its life cycle. */
export type SlaRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a sla record and its current status. */
export class SlaRecord {
  code: string;
  label: string;
  ratio: number;
  windowDays: number;
  batchSize: number;
  attributes: Map<string, string>;
  audienceId: string;
  score: number;
  budget: number;
  campaignRef: string;
  status: SlaRecordStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    windowDays: number,
    batchSize: number,
    attributes: Map<string, string>,
    audienceId: string,
    score: number,
    budget: number,
    campaignRef: string,
    status: SlaRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.attributes = attributes;
    this.audienceId = audienceId;
    this.score = score;
    this.budget = budget;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"sla record"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.score + this.budget) * 100) / 100;
  }

  copy(): SlaRecord {
    return new SlaRecord(
      this.code,
      this.label,
      this.ratio,
      this.windowDays,
      this.batchSize,
      this.attributes,
      this.audienceId,
      this.score,
      this.budget,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla record in status created. */
export function newSlaRecord(code: string, label: string): SlaRecord {
  return new SlaRecord(code, label, 0, 0, 0, new Map<string, string>(), "", 0, 0, "", "created");
}
