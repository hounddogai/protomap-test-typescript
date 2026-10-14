import * as text from "../../../../kit/text.js";

/** Where a pending proof mapping is in its life cycle. */
export type PendingProofMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending proof mapping, with what the planners need to act on it. */
export class PendingProofMapping {
  code: string;
  label: string;
  visible: boolean;
  createdAt: number;
  score: number;
  country: string;
  expiresAt: number;
  externalRef: string;
  journeyId: string;
  summary: string;
  budget: number;
  status: PendingProofMappingStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    createdAt: number,
    score: number,
    country: string,
    expiresAt: number,
    externalRef: string,
    journeyId: string,
    summary: string,
    budget: number,
    status: PendingProofMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.createdAt = createdAt;
    this.score = score;
    this.country = country;
    this.expiresAt = expiresAt;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.summary = summary;
    this.budget = budget;
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

  canMoveTo(next: PendingProofMappingStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PendingProofMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending proof mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.createdAt - this.score) * 100) / 100;
  }

  copy(): PendingProofMapping {
    return new PendingProofMapping(
      this.code,
      this.label,
      this.visible,
      this.createdAt,
      this.score,
      this.country,
      this.expiresAt,
      this.externalRef,
      this.journeyId,
      this.summary,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending proof mapping in status new. */
export function newPendingProofMapping(code: string, label: string): PendingProofMapping {
  return new PendingProofMapping(code, label, false, 0, 0, "", 0, "", "", "", 0, "new");
}
