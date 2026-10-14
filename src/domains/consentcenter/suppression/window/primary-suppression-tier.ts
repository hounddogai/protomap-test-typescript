import * as text from "../../../../kit/text.js";

/** Where a primary suppression tier is in its life cycle. */
export type PrimarySuppressionTierStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary suppression tier and its current status. */
export class PrimarySuppressionTier {
  code: string;
  title: string;
  audienceId: string;
  revision: number;
  region: string;
  status: PrimarySuppressionTierStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    revision: number,
    region: string,
    status: PrimarySuppressionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.revision = revision;
    this.region = region;
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

  canMoveTo(next: PrimarySuppressionTierStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimarySuppressionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary suppression tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"primary suppression tier"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): PrimarySuppressionTier {
    return new PrimarySuppressionTier(this.code, this.title, this.audienceId, this.revision, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary suppression tier in status requested. */
export function newPrimarySuppressionTier(code: string, title: string): PrimarySuppressionTier {
  return new PrimarySuppressionTier(code, title, "", 0, "", "requested");
}
