/**
 * The primary proof checkpoint records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary proof checkpoint is in its life cycle. */
export type PrimaryProofCheckpointStatus = "created" | "validated" | "published" | "retired";

/** One primary proof checkpoint, with what the planners need to act on it. */
export class PrimaryProofCheckpoint {
  code: string;
  label: string;
  batchSize: number;
  reviewer: string;
  summary: string;
  channel: string;
  frequencyCap: number;
  conversionRate: number;
  expiresAt: number;
  contactEmail: string;
  status: PrimaryProofCheckpointStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    reviewer: string,
    summary: string,
    channel: string,
    frequencyCap: number,
    conversionRate: number,
    expiresAt: number,
    contactEmail: string,
    status: PrimaryProofCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.summary = summary;
    this.channel = channel;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: PrimaryProofCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryProofCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary proof checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary proof checkpoint"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.frequencyCap * this.conversionRate * 100) / 100;
  }

  copy(): PrimaryProofCheckpoint {
    return new PrimaryProofCheckpoint(
      this.code,
      this.label,
      this.batchSize,
      this.reviewer,
      this.summary,
      this.channel,
      this.frequencyCap,
      this.conversionRate,
      this.expiresAt,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary proof checkpoint in status created. */
export function newPrimaryProofCheckpoint(code: string, label: string): PrimaryProofCheckpoint {
  return new PrimaryProofCheckpoint(code, label, 0, "", "", "", 0, 0, 0, "", "created");
}
