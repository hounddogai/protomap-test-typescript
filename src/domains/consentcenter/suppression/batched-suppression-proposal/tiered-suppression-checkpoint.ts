import * as text from "../../../../kit/text.js";

/** Where a tiered suppression checkpoint is in its life cycle. */
export type TieredSuppressionCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a tiered suppression checkpoint and its current status. */
export class TieredSuppressionCheckpoint {
  code: string;
  name: string;
  conversionRate: number;
  sendAt: number;
  channel: string;
  campaignRef: string;
  audienceId: string;
  contactEmail: string;
  status: TieredSuppressionCheckpointStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    sendAt: number,
    channel: string,
    campaignRef: string,
    audienceId: string,
    contactEmail: string,
    status: TieredSuppressionCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: TieredSuppressionCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredSuppressionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered suppression checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.conversionRate - this.sendAt) * 100) / 100;
  }

  copy(): TieredSuppressionCheckpoint {
    return new TieredSuppressionCheckpoint(
      this.code,
      this.name,
      this.conversionRate,
      this.sendAt,
      this.channel,
      this.campaignRef,
      this.audienceId,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered suppression checkpoint in status requested. */
export function newTieredSuppressionCheckpoint(code: string, name: string): TieredSuppressionCheckpoint {
  return new TieredSuppressionCheckpoint(code, name, 0, 0, "", "", "", "", "requested");
}
