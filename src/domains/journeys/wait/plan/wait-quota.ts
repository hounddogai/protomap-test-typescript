import * as text from "../../../../kit/text.js";

/** Where a wait quota is in its life cycle. */
export type WaitQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A wait quota. Its code is unique within a tenant. */
export class WaitQuota {
  code: string;
  title: string;
  campaignRef: string;
  maximum: number;
  externalRef: string;
  status: WaitQuotaStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    maximum: number,
    externalRef: string,
    status: WaitQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"wait quota"} ${this.code}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): WaitQuota {
    return new WaitQuota(this.code, this.title, this.campaignRef, this.maximum, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait quota in status idle. */
export function newWaitQuota(code: string, title: string): WaitQuota {
  return new WaitQuota(code, title, "", 0, "", "idle");
}
