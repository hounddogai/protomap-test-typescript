/**
 * The weighted sender threshold records of deliverability's sender work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted sender threshold is in its life cycle. */
export type WeightedSenderThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted sender threshold. Its code is unique within a tenant. */
export class WeightedSenderThreshold {
  code: string;
  title: string;
  score: number;
  graceDays: number;
  utmSource: string;
  tags: string[];
  visible: boolean;
  sendAt: number;
  weight: number;
  campaignRef: string;
  reviewer: string;
  status: WeightedSenderThresholdStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    graceDays: number,
    utmSource: string,
    tags: string[],
    visible: boolean,
    sendAt: number,
    weight: number,
    campaignRef: string,
    reviewer: string,
    status: WeightedSenderThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.graceDays = graceDays;
    this.utmSource = utmSource;
    this.tags = tags;
    this.visible = visible;
    this.sendAt = sendAt;
    this.weight = weight;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedSenderThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedSenderThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted sender threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round(this.score * this.sendAt * 100) / 100;
  }

  copy(): WeightedSenderThreshold {
    return new WeightedSenderThreshold(
      this.code,
      this.title,
      this.score,
      this.graceDays,
      this.utmSource,
      this.tags,
      this.visible,
      this.sendAt,
      this.weight,
      this.campaignRef,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a weighted sender threshold in status draft. */
export function newWeightedSenderThreshold(code: string, title: string): WeightedSenderThreshold {
  return new WeightedSenderThreshold(code, title, 0, 0, "", [], false, 0, 0, "", "", "draft");
}
