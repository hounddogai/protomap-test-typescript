import * as text from "../../../../kit/text.js";

/** Where a weighted sender quota is in its life cycle. */
export type WeightedSenderQuotaStatus = "created" | "validated" | "published" | "retired";

/** The record of a weighted sender quota and its current status. */
export class WeightedSenderQuota {
  code: string;
  title: string;
  sequence: number;
  externalRef: string;
  channel: string;
  maximum: number;
  archived: boolean;
  segment: string;
  margin: number;
  ownerId: string;
  unit: string;
  status: WeightedSenderQuotaStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    externalRef: string,
    channel: string,
    maximum: number,
    archived: boolean,
    segment: string,
    margin: number,
    ownerId: string,
    unit: string,
    status: WeightedSenderQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.channel = channel;
    this.maximum = maximum;
    this.archived = archived;
    this.segment = segment;
    this.margin = margin;
    this.ownerId = ownerId;
    this.unit = unit;
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

  canMoveTo(next: WeightedSenderQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedSenderQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted sender quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netVolume(): number {
    return Math.round(this.sequence * this.maximum * 100) / 100;
  }

  copy(): WeightedSenderQuota {
    return new WeightedSenderQuota(
      this.code,
      this.title,
      this.sequence,
      this.externalRef,
      this.channel,
      this.maximum,
      this.archived,
      this.segment,
      this.margin,
      this.ownerId,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted sender quota in status created. */
export function newWeightedSenderQuota(code: string, title: string): WeightedSenderQuota {
  return new WeightedSenderQuota(code, title, 0, "", "", 0, false, "", 0, "", "", "created");
}
