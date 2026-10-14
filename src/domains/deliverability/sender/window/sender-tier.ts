import * as text from "../../../../kit/text.js";

/** Where a sender tier is in its life cycle. */
export type SenderTierStatus = "created" | "validated" | "published" | "retired";

/** A sender tier. Its code is unique within a tenant. */
export class SenderTier {
  code: string;
  label: string;
  updatedAt: number;
  openRate: number;
  visible: boolean;
  maximum: number;
  audienceId: string;
  floorValue: number;
  checksum: string;
  channel: string;
  status: SenderTierStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    openRate: number,
    visible: boolean,
    maximum: number,
    audienceId: string,
    floorValue: number,
    checksum: string,
    channel: string,
    status: SenderTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.visible = visible;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.checksum = checksum;
    this.channel = channel;
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

  canMoveTo(next: SenderTierStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
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

  moveTo(next: SenderTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round((this.maximum + this.openRate) * 100) / 100;
  }

  copy(): SenderTier {
    return new SenderTier(
      this.code,
      this.label,
      this.updatedAt,
      this.openRate,
      this.visible,
      this.maximum,
      this.audienceId,
      this.floorValue,
      this.checksum,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sender tier in status created. */
export function newSenderTier(code: string, label: string): SenderTier {
  return new SenderTier(code, label, 0, 0, false, 0, "", 0, "", "", "created");
}
