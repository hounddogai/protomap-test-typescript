import * as text from "../../../../kit/text.js";

/** Where a global invite policy is in its life cycle. */
export type GlobalInvitePolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A global invite policy. Its code is unique within a tenant. */
export class GlobalInvitePolicy {
  code: string;
  title: string;
  audienceId: string;
  campaignRef: string;
  createdAt: number;
  capacity: number;
  utmSource: string;
  status: GlobalInvitePolicyStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    campaignRef: string,
    createdAt: number,
    capacity: number,
    utmSource: string,
    status: GlobalInvitePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.utmSource = utmSource;
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

  canMoveTo(next: GlobalInvitePolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalInvitePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global invite policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global invite policy"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.createdAt * this.capacity * 100) / 100;
  }

  copy(): GlobalInvitePolicy {
    return new GlobalInvitePolicy(
      this.code,
      this.title,
      this.audienceId,
      this.campaignRef,
      this.createdAt,
      this.capacity,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global invite policy in status requested. */
export function newGlobalInvitePolicy(code: string, title: string): GlobalInvitePolicy {
  return new GlobalInvitePolicy(code, title, "", "", 0, 0, "", "requested");
}
