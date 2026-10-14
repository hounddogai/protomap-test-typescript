/**
 * The lenient conversion audit records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient conversion audit is in its life cycle. */
export type LenientConversionAuditStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient conversion audit and its current status. */
export class LenientConversionAudit {
  code: string;
  label: string;
  startsAt: number;
  name: string;
  batchSize: number;
  segment: string;
  ownerId: string;
  approved: boolean;
  status: LenientConversionAuditStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    name: string,
    batchSize: number,
    segment: string,
    ownerId: string,
    approved: boolean,
    status: LenientConversionAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.name = name;
    this.batchSize = batchSize;
    this.segment = segment;
    this.ownerId = ownerId;
    this.approved = approved;
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

  canMoveTo(next: LenientConversionAuditStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
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

  moveTo(next: LenientConversionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient conversion audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round(this.startsAt * this.batchSize * 100) / 100;
  }

  copy(): LenientConversionAudit {
    return new LenientConversionAudit(
      this.code,
      this.label,
      this.startsAt,
      this.name,
      this.batchSize,
      this.segment,
      this.ownerId,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient conversion audit in status created. */
export function newLenientConversionAudit(code: string, label: string): LenientConversionAudit {
  return new LenientConversionAudit(code, label, 0, "", 0, "", "", false, "created");
}
