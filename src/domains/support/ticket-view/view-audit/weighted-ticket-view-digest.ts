import * as text from "../../../../kit/text.js";

/** Where a weighted ticket view digest is in its life cycle. */
export type WeightedTicketViewDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted ticket view digest. Its code is unique within a tenant. */
export class WeightedTicketViewDigest {
  code: string;
  name: string;
  checksum: string;
  tags: string[];
  quantity: number;
  clicks: number;
  channel: string;
  pinned: boolean;
  status: WeightedTicketViewDigestStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    tags: string[],
    quantity: number,
    clicks: number,
    channel: string,
    pinned: boolean,
    status: WeightedTicketViewDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.tags = tags;
    this.quantity = quantity;
    this.clicks = clicks;
    this.channel = channel;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedTicketViewDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedTicketViewDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted ticket view digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.clicks + this.quantity) * 100) / 100;
  }

  copy(): WeightedTicketViewDigest {
    return new WeightedTicketViewDigest(
      this.code,
      this.name,
      this.checksum,
      this.tags,
      this.quantity,
      this.clicks,
      this.channel,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted ticket view digest in status planned. */
export function newWeightedTicketViewDigest(code: string, name: string): WeightedTicketViewDigest {
  return new WeightedTicketViewDigest(code, name, "", [], 0, 0, "", false, "planned");
}
