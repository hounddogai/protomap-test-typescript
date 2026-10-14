import * as text from "../../../../kit/text.js";

/** Where a regional reply digest is in its life cycle. */
export type RegionalReplyDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One regional reply digest, with what the planners need to act on it. */
export class RegionalReplyDigest {
  code: string;
  name: string;
  maximum: number;
  version: number;
  title: string;
  channel: string;
  checksum: string;
  sendAt: number;
  budget: number;
  audienceId: string;
  status: RegionalReplyDigestStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    version: number,
    title: string,
    channel: string,
    checksum: string,
    sendAt: number,
    budget: number,
    audienceId: string,
    status: RegionalReplyDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.version = version;
    this.title = title;
    this.channel = channel;
    this.checksum = checksum;
    this.sendAt = sendAt;
    this.budget = budget;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalReplyDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalReplyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reply digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedExposure(): number {
    return Math.round(this.version * this.budget * 100) / 100;
  }

  copy(): RegionalReplyDigest {
    return new RegionalReplyDigest(
      this.code,
      this.name,
      this.maximum,
      this.version,
      this.title,
      this.channel,
      this.checksum,
      this.sendAt,
      this.budget,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional reply digest in status proposed. */
export function newRegionalReplyDigest(code: string, name: string): RegionalReplyDigest {
  return new RegionalReplyDigest(code, name, 0, 0, "", "", "", 0, 0, "", "proposed");
}
