import * as text from "../../../../kit/text.js";

/** Where a funnel threshold is in its life cycle. */
export type FunnelThresholdStatus = "created" | "validated" | "published" | "retired";

/** A funnel threshold. Its code is unique within a tenant. */
export class FunnelThreshold {
  code: string;
  title: string;
  batchSize: number;
  margin: number;
  campaignRef: string;
  label: string;
  checksum: string;
  attempts: number;
  archived: boolean;
  status: FunnelThresholdStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    margin: number,
    campaignRef: string,
    label: string,
    checksum: string,
    attempts: number,
    archived: boolean,
    status: FunnelThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.label = label;
    this.checksum = checksum;
    this.attempts = attempts;
    this.archived = archived;
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

  canMoveTo(next: FunnelThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FunnelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"funnel threshold"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.margin - this.attempts) * 100) / 100;
  }

  copy(): FunnelThreshold {
    return new FunnelThreshold(
      this.code,
      this.title,
      this.batchSize,
      this.margin,
      this.campaignRef,
      this.label,
      this.checksum,
      this.attempts,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a funnel threshold in status created. */
export function newFunnelThreshold(code: string, title: string): FunnelThreshold {
  return new FunnelThreshold(code, title, 0, 0, "", "", "", 0, false, "created");
}
