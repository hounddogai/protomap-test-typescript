import * as text from "../../../../kit/text.js";

/** Where a reputation score is in its life cycle. */
export type ReputationScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A reputation score. Its code is unique within a tenant. */
export class ReputationScore {
  code: string;
  label: string;
  audienceId: string;
  region: string;
  discount: number;
  tags: string[];
  limit: number;
  variant: string;
  createdAt: number;
  floorValue: number;
  sendAt: number;
  status: ReputationScoreStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    region: string,
    discount: number,
    tags: string[],
    limit: number,
    variant: string,
    createdAt: number,
    floorValue: number,
    sendAt: number,
    status: ReputationScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.region = region;
    this.discount = discount;
    this.tags = tags;
    this.limit = limit;
    this.variant = variant;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
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

  canMoveTo(next: ReputationScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round(this.limit * this.discount * 100) / 100;
  }

  copy(): ReputationScore {
    return new ReputationScore(
      this.code,
      this.label,
      this.audienceId,
      this.region,
      this.discount,
      this.tags,
      this.limit,
      this.variant,
      this.createdAt,
      this.floorValue,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reputation score in status requested. */
export function newReputationScore(code: string, label: string): ReputationScore {
  return new ReputationScore(code, label, "", "", 0, [], 0, "", 0, 0, 0, "requested");
}
