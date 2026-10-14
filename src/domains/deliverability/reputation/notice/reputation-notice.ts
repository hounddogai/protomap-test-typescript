/**
 * The reputation notice records of deliverability's reputation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation notice is in its life cycle. */
export type ReputationNoticeStatus = "created" | "validated" | "published" | "retired";

/** The record of a reputation notice and its current status. */
export class ReputationNotice {
  code: string;
  label: string;
  journeyId: string;
  region: string;
  utmSource: string;
  threshold: number;
  audienceId: string;
  attributes: Map<string, string>;
  ratio: number;
  checksum: string;
  cost: number;
  status: ReputationNoticeStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    region: string,
    utmSource: string,
    threshold: number,
    audienceId: string,
    attributes: Map<string, string>,
    ratio: number,
    checksum: string,
    cost: number,
    status: ReputationNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.region = region;
    this.utmSource = utmSource;
    this.threshold = threshold;
    this.audienceId = audienceId;
    this.attributes = attributes;
    this.ratio = ratio;
    this.checksum = checksum;
    this.cost = cost;
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

  canMoveTo(next: ReputationNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round(this.ratio * this.cost * 100) / 100;
  }

  copy(): ReputationNotice {
    return new ReputationNotice(
      this.code,
      this.label,
      this.journeyId,
      this.region,
      this.utmSource,
      this.threshold,
      this.audienceId,
      this.attributes,
      this.ratio,
      this.checksum,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reputation notice in status created. */
export function newReputationNotice(code: string, label: string): ReputationNotice {
  return new ReputationNotice(code, label, "", "", "", 0, "", new Map<string, string>(), 0, "", 0, "created");
}
