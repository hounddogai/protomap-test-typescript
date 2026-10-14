import * as text from "../../../../kit/text.js";

/** Where a escalation quota is in its life cycle. */
export type EscalationQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A escalation quota as the escalation team keeps it. */
export class EscalationQuota {
  code: string;
  name: string;
  ownerId: string;
  visible: boolean;
  impressions: number;
  limit: number;
  label: string;
  endsAt: number;
  channel: string;
  campaignRef: string;
  status: EscalationQuotaStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    visible: boolean,
    impressions: number,
    limit: number,
    label: string,
    endsAt: number,
    channel: string,
    campaignRef: string,
    status: EscalationQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.visible = visible;
    this.impressions = impressions;
    this.limit = limit;
    this.label = label;
    this.endsAt = endsAt;
    this.channel = channel;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: EscalationQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: EscalationQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"escalation quota"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.endsAt + this.limit) * 100) / 100;
  }

  copy(): EscalationQuota {
    return new EscalationQuota(
      this.code,
      this.name,
      this.ownerId,
      this.visible,
      this.impressions,
      this.limit,
      this.label,
      this.endsAt,
      this.channel,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a escalation quota in status idle. */
export function newEscalationQuota(code: string, name: string): EscalationQuota {
  return new EscalationQuota(code, name, "", false, 0, 0, "", 0, "", "", "idle");
}
