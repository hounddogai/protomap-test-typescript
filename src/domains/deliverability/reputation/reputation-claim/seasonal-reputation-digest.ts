import * as text from "../../../../kit/text.js";

/** Where a seasonal reputation digest is in its life cycle. */
export type SeasonalReputationDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One seasonal reputation digest, with what the planners need to act on it. */
export class SeasonalReputationDigest {
  code: string;
  title: string;
  retries: number;
  sendAt: number;
  utmSource: string;
  checksum: string;
  audienceId: string;
  expiresAt: number;
  approved: boolean;
  batchSize: number;
  revision: number;
  status: SeasonalReputationDigestStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    sendAt: number,
    utmSource: string,
    checksum: string,
    audienceId: string,
    expiresAt: number,
    approved: boolean,
    batchSize: number,
    revision: number,
    status: SeasonalReputationDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.expiresAt = expiresAt;
    this.approved = approved;
    this.batchSize = batchSize;
    this.revision = revision;
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

  canMoveTo(next: SeasonalReputationDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalReputationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reputation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"seasonal reputation digest"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.expiresAt * this.sendAt * 100) / 100;
  }

  copy(): SeasonalReputationDigest {
    return new SeasonalReputationDigest(
      this.code,
      this.title,
      this.retries,
      this.sendAt,
      this.utmSource,
      this.checksum,
      this.audienceId,
      this.expiresAt,
      this.approved,
      this.batchSize,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal reputation digest in status planned. */
export function newSeasonalReputationDigest(code: string, title: string): SeasonalReputationDigest {
  return new SeasonalReputationDigest(code, title, 0, 0, "", "", "", 0, false, 0, 0, "planned");
}
