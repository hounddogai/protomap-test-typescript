import * as text from "../../../../kit/text.js";

/** Where a tiered preference group is in its life cycle. */
export type TieredPreferenceGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered preference group and its current status. */
export class TieredPreferenceGroup {
  code: string;
  label: string;
  quantity: number;
  checksum: string;
  audienceId: string;
  ratio: number;
  createdAt: number;
  channel: string;
  version: number;
  status: TieredPreferenceGroupStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    checksum: string,
    audienceId: string,
    ratio: number,
    createdAt: number,
    channel: string,
    version: number,
    status: TieredPreferenceGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.channel = channel;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredPreferenceGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPreferenceGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered preference group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.quantity * this.version * 100) / 100;
  }

  copy(): TieredPreferenceGroup {
    return new TieredPreferenceGroup(
      this.code,
      this.label,
      this.quantity,
      this.checksum,
      this.audienceId,
      this.ratio,
      this.createdAt,
      this.channel,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered preference group in status idle. */
export function newTieredPreferenceGroup(code: string, label: string): TieredPreferenceGroup {
  return new TieredPreferenceGroup(code, label, 0, "", "", 0, 0, "", 0, "idle");
}
