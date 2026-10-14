/**
 * The conversion manifest records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion manifest is in its life cycle. */
export type ConversionManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a conversion manifest and its current status. */
export class ConversionManifest {
  code: string;
  title: string;
  rate: number;
  campaignRef: string;
  segment: string;
  sequence: number;
  reviewer: string;
  impressions: number;
  maximum: number;
  status: ConversionManifestStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    campaignRef: string,
    segment: string,
    sequence: number,
    reviewer: string,
    impressions: number,
    maximum: number,
    status: ConversionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.sequence = sequence;
    this.reviewer = reviewer;
    this.impressions = impressions;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ConversionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"conversion manifest"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.rate - this.impressions) * 100) / 100;
  }

  copy(): ConversionManifest {
    return new ConversionManifest(
      this.code,
      this.title,
      this.rate,
      this.campaignRef,
      this.segment,
      this.sequence,
      this.reviewer,
      this.impressions,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a conversion manifest in status proposed. */
export function newConversionManifest(code: string, title: string): ConversionManifest {
  return new ConversionManifest(code, title, 0, "", "", 0, "", 0, 0, "proposed");
}
