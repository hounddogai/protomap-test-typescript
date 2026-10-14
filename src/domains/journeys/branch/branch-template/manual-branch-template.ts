/**
 * The manual branch template records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual branch template is in its life cycle. */
export type ManualBranchTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a manual branch template and its current status. */
export class ManualBranchTemplate {
  code: string;
  label: string;
  openRate: number;
  source: string;
  ratio: number;
  maximum: number;
  bid: number;
  externalRef: string;
  batchSize: number;
  status: ManualBranchTemplateStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    source: string,
    ratio: number,
    maximum: number,
    bid: number,
    externalRef: string,
    batchSize: number,
    status: ManualBranchTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.source = source;
    this.ratio = ratio;
    this.maximum = maximum;
    this.bid = bid;
    this.externalRef = externalRef;
    this.batchSize = batchSize;
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

  canMoveTo(next: ManualBranchTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualBranchTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual branch template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.bid - this.maximum) * 100) / 100;
  }

  copy(): ManualBranchTemplate {
    return new ManualBranchTemplate(
      this.code,
      this.label,
      this.openRate,
      this.source,
      this.ratio,
      this.maximum,
      this.bid,
      this.externalRef,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual branch template in status new. */
export function newManualBranchTemplate(code: string, label: string): ManualBranchTemplate {
  return new ManualBranchTemplate(code, label, 0, "", 0, 0, 0, "", 0, "new");
}
