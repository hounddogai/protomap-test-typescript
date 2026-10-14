import * as text from "../../../../kit/text.js";

/** Where a rolling level batch is in its life cycle. */
export type RollingLevelBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling level batch and its current status. */
export class RollingLevelBatch {
  code: string;
  label: string;
  minimum: number;
  rate: number;
  impressions: number;
  audienceId: string;
  status: RollingLevelBatchStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    rate: number,
    impressions: number,
    audienceId: string,
    status: RollingLevelBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.rate = rate;
    this.impressions = impressions;
    this.audienceId = audienceId;
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

  canMoveTo(next: RollingLevelBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingLevelBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling level batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling level batch"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.impressions + this.rate) * 100) / 100;
  }

  copy(): RollingLevelBatch {
    return new RollingLevelBatch(
      this.code,
      this.label,
      this.minimum,
      this.rate,
      this.impressions,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling level batch in status requested. */
export function newRollingLevelBatch(code: string, label: string): RollingLevelBatch {
  return new RollingLevelBatch(code, label, 0, 0, 0, "", "requested");
}
