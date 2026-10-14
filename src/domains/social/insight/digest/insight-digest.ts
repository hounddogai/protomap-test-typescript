/**
 * The insight digest records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight digest is in its life cycle. */
export type InsightDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A insight digest. Its code is unique within a tenant. */
export class InsightDigest {
  code: string;
  name: string;
  threshold: number;
  channel: string;
  openRate: number;
  impressions: number;
  utmSource: string;
  priority: number;
  status: InsightDigestStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    channel: string,
    openRate: number,
    impressions: number,
    utmSource: string,
    priority: number,
    status: InsightDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.channel = channel;
    this.openRate = openRate;
    this.impressions = impressions;
    this.utmSource = utmSource;
    this.priority = priority;
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

  canMoveTo(next: InsightDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight digest"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.openRate - this.threshold) * 100) / 100;
  }

  copy(): InsightDigest {
    return new InsightDigest(
      this.code,
      this.name,
      this.threshold,
      this.channel,
      this.openRate,
      this.impressions,
      this.utmSource,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a insight digest in status proposed. */
export function newInsightDigest(code: string, name: string): InsightDigest {
  return new InsightDigest(code, name, 0, "", 0, 0, "", 0, "proposed");
}
