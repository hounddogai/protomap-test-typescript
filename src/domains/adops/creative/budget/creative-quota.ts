import * as text from "../../../../kit/text.js";

/** Where a creative quota is in its life cycle. */
export type CreativeQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A creative quota as the creative team keeps it. */
export class CreativeQuota {
  code: string;
  name: string;
  conversionRate: number;
  attempts: number;
  phone: string;
  createdAt: number;
  amount: number;
  channel: string;
  version: number;
  status: CreativeQuotaStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    attempts: number,
    phone: string,
    createdAt: number,
    amount: number,
    channel: string,
    version: number,
    status: CreativeQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.phone = phone;
    this.createdAt = createdAt;
    this.amount = amount;
    this.channel = channel;
    this.version = version;
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

  canMoveTo(next: CreativeQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round(this.version * this.amount * 100) / 100;
  }

  copy(): CreativeQuota {
    return new CreativeQuota(
      this.code,
      this.name,
      this.conversionRate,
      this.attempts,
      this.phone,
      this.createdAt,
      this.amount,
      this.channel,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a creative quota in status idle. */
export function newCreativeQuota(code: string, name: string): CreativeQuota {
  return new CreativeQuota(code, name, 0, 0, "", 0, 0, "", 0, "idle");
}
