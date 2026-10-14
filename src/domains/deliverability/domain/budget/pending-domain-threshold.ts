import * as text from "../../../../kit/text.js";

/** Where a pending domain threshold is in its life cycle. */
export type PendingDomainThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending domain threshold. Its code is unique within a tenant. */
export class PendingDomainThreshold {
  code: string;
  name: string;
  durationMinutes: number;
  locale: string;
  channel: string;
  openRate: number;
  cost: number;
  pinned: boolean;
  phone: string;
  version: number;
  status: PendingDomainThresholdStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    locale: string,
    channel: string,
    openRate: number,
    cost: number,
    pinned: boolean,
    phone: string,
    version: number,
    status: PendingDomainThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.channel = channel;
    this.openRate = openRate;
    this.cost = cost;
    this.pinned = pinned;
    this.phone = phone;
    this.version = version;
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

  canMoveTo(next: PendingDomainThresholdStatus): boolean {
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingDomainThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending domain threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"pending domain threshold"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.cost - this.durationMinutes) * 100) / 100;
  }

  copy(): PendingDomainThreshold {
    return new PendingDomainThreshold(
      this.code,
      this.name,
      this.durationMinutes,
      this.locale,
      this.channel,
      this.openRate,
      this.cost,
      this.pinned,
      this.phone,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending domain threshold in status proposed. */
export function newPendingDomainThreshold(code: string, name: string): PendingDomainThreshold {
  return new PendingDomainThreshold(code, name, 0, "", "", 0, 0, false, "", 0, "proposed");
}
