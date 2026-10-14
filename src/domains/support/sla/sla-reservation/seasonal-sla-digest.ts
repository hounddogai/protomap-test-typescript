import * as text from "../../../../kit/text.js";

/** Where a seasonal sla digest is in its life cycle. */
export type SeasonalSlaDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One seasonal sla digest, with what the planners need to act on it. */
export class SeasonalSlaDigest {
  code: string;
  name: string;
  description: string;
  quantity: number;
  channel: string;
  checksum: string;
  notes: string;
  unit: string;
  audienceId: string;
  cost: number;
  source: string;
  status: SeasonalSlaDigestStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    quantity: number,
    channel: string,
    checksum: string,
    notes: string,
    unit: string,
    audienceId: string,
    cost: number,
    source: string,
    status: SeasonalSlaDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.quantity = quantity;
    this.channel = channel;
    this.checksum = checksum;
    this.notes = notes;
    this.unit = unit;
    this.audienceId = audienceId;
    this.cost = cost;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalSlaDigestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalSlaDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal sla digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.cost - this.quantity) * 100) / 100;
  }

  copy(): SeasonalSlaDigest {
    return new SeasonalSlaDigest(
      this.code,
      this.name,
      this.description,
      this.quantity,
      this.channel,
      this.checksum,
      this.notes,
      this.unit,
      this.audienceId,
      this.cost,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal sla digest in status new. */
export function newSeasonalSlaDigest(code: string, name: string): SeasonalSlaDigest {
  return new SeasonalSlaDigest(code, name, "", 0, "", "", "", "", "", 0, "", "new");
}
