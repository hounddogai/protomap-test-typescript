import * as text from "../../../../kit/text.js";

/** Where a adaptive domain group is in its life cycle. */
export type AdaptiveDomainGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive domain group as the domain team keeps it. */
export class AdaptiveDomainGroup {
  code: string;
  title: string;
  cost: number;
  ratio: number;
  updatedAt: number;
  checksum: string;
  externalRef: string;
  audienceId: string;
  createdAt: number;
  status: AdaptiveDomainGroupStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    ratio: number,
    updatedAt: number,
    checksum: string,
    externalRef: string,
    audienceId: string,
    createdAt: number,
    status: AdaptiveDomainGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
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

  canMoveTo(next: AdaptiveDomainGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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

  moveTo(next: AdaptiveDomainGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive domain group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive domain group"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.ratio - this.createdAt) * 100) / 100;
  }

  copy(): AdaptiveDomainGroup {
    return new AdaptiveDomainGroup(
      this.code,
      this.title,
      this.cost,
      this.ratio,
      this.updatedAt,
      this.checksum,
      this.externalRef,
      this.audienceId,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive domain group in status proposed. */
export function newAdaptiveDomainGroup(code: string, title: string): AdaptiveDomainGroup {
  return new AdaptiveDomainGroup(code, title, 0, 0, 0, "", "", "", 0, "proposed");
}
