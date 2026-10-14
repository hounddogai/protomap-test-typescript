/**
 * The adaptive sla mapping records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive sla mapping is in its life cycle. */
export type AdaptiveSlaMappingStatus = "created" | "validated" | "published" | "retired";

/** A adaptive sla mapping. Its code is unique within a tenant. */
export class AdaptiveSlaMapping {
  code: string;
  title: string;
  source: string;
  audienceId: string;
  variant: string;
  threshold: number;
  region: string;
  visible: boolean;
  tags: string[];
  openRate: number;
  sendAt: number;
  status: AdaptiveSlaMappingStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    audienceId: string,
    variant: string,
    threshold: number,
    region: string,
    visible: boolean,
    tags: string[],
    openRate: number,
    sendAt: number,
    status: AdaptiveSlaMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.audienceId = audienceId;
    this.variant = variant;
    this.threshold = threshold;
    this.region = region;
    this.visible = visible;
    this.tags = tags;
    this.openRate = openRate;
    this.sendAt = sendAt;
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

  canMoveTo(next: AdaptiveSlaMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
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

  moveTo(next: AdaptiveSlaMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sla mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.openRate - this.threshold) * 100) / 100;
  }

  copy(): AdaptiveSlaMapping {
    return new AdaptiveSlaMapping(
      this.code,
      this.title,
      this.source,
      this.audienceId,
      this.variant,
      this.threshold,
      this.region,
      this.visible,
      this.tags,
      this.openRate,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive sla mapping in status created. */
export function newAdaptiveSlaMapping(code: string, title: string): AdaptiveSlaMapping {
  return new AdaptiveSlaMapping(code, title, "", "", "", 0, "", false, [], 0, 0, "created");
}
