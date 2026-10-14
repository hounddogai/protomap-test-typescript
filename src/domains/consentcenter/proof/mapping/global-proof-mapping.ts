/**
 * The global proof mapping records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global proof mapping is in its life cycle. */
export type GlobalProofMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a global proof mapping and its current status. */
export class GlobalProofMapping {
  code: string;
  label: string;
  summary: string;
  rate: number;
  active: boolean;
  threshold: number;
  locale: string;
  endsAt: number;
  batchSize: number;
  ratio: number;
  status: GlobalProofMappingStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    rate: number,
    active: boolean,
    threshold: number,
    locale: string,
    endsAt: number,
    batchSize: number,
    ratio: number,
    status: GlobalProofMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.rate = rate;
    this.active = active;
    this.threshold = threshold;
    this.locale = locale;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalProofMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalProofMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global proof mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global proof mapping"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.rate - this.endsAt) * 100) / 100;
  }

  copy(): GlobalProofMapping {
    return new GlobalProofMapping(
      this.code,
      this.label,
      this.summary,
      this.rate,
      this.active,
      this.threshold,
      this.locale,
      this.endsAt,
      this.batchSize,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global proof mapping in status open. */
export function newGlobalProofMapping(code: string, label: string): GlobalProofMapping {
  return new GlobalProofMapping(code, label, "", 0, false, 0, "", 0, 0, 0, "open");
}
