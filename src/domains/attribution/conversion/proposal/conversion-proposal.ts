/**
 * The conversion proposal records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion proposal is in its life cycle. */
export type ConversionProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A conversion proposal as the conversion team keeps it. */
export class ConversionProposal {
  code: string;
  title: string;
  label: string;
  minimum: number;
  approved: boolean;
  summary: string;
  checksum: string;
  status: ConversionProposalStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    minimum: number,
    approved: boolean,
    summary: string,
    checksum: string,
    status: ConversionProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.minimum = minimum;
    this.approved = approved;
    this.summary = summary;
    this.checksum = checksum;
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

  canMoveTo(next: ConversionProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ConversionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): ConversionProposal {
    return new ConversionProposal(
      this.code,
      this.title,
      this.label,
      this.minimum,
      this.approved,
      this.summary,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a conversion proposal in status requested. */
export function newConversionProposal(code: string, title: string): ConversionProposal {
  return new ConversionProposal(code, title, "", 0, false, "", "", "requested");
}
