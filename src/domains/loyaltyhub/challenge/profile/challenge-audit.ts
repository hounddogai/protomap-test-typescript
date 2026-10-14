import * as text from "../../../../kit/text.js";

/** Where a challenge audit is in its life cycle. */
export type ChallengeAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One challenge audit, with what the planners need to act on it. */
export class ChallengeAudit {
  code: string;
  name: string;
  approved: boolean;
  tags: string[];
  ceiling: number;
  ratio: number;
  weight: number;
  channel: string;
  checksum: string;
  impressions: number;
  bid: number;
  status: ChallengeAuditStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    tags: string[],
    ceiling: number,
    ratio: number,
    weight: number,
    channel: string,
    checksum: string,
    impressions: number,
    bid: number,
    status: ChallengeAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.tags = tags;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.weight = weight;
    this.channel = channel;
    this.checksum = checksum;
    this.impressions = impressions;
    this.bid = bid;
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

  canMoveTo(next: ChallengeAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"challenge audit"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round(this.ceiling * this.impressions * 100) / 100;
  }

  copy(): ChallengeAudit {
    return new ChallengeAudit(
      this.code,
      this.name,
      this.approved,
      this.tags,
      this.ceiling,
      this.ratio,
      this.weight,
      this.channel,
      this.checksum,
      this.impressions,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a challenge audit in status planned. */
export function newChallengeAudit(code: string, name: string): ChallengeAudit {
  return new ChallengeAudit(code, name, false, [], 0, 0, 0, "", "", 0, 0, "planned");
}
