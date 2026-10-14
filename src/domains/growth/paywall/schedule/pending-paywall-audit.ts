import * as text from "../../../../kit/text.js";

/** Where a pending paywall audit is in its life cycle. */
export type PendingPaywallAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending paywall audit as the paywall team keeps it. */
export class PendingPaywallAudit {
  code: string;
  label: string;
  sendAt: number;
  source: string;
  graceDays: number;
  windowDays: number;
  attributes: Map<string, string>;
  retries: number;
  status: PendingPaywallAuditStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    source: string,
    graceDays: number,
    windowDays: number,
    attributes: Map<string, string>,
    retries: number,
    status: PendingPaywallAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.source = source;
    this.graceDays = graceDays;
    this.windowDays = windowDays;
    this.attributes = attributes;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingPaywallAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingPaywallAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending paywall audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pending paywall audit"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.windowDays - this.sendAt) * 100) / 100;
  }

  copy(): PendingPaywallAudit {
    return new PendingPaywallAudit(
      this.code,
      this.label,
      this.sendAt,
      this.source,
      this.graceDays,
      this.windowDays,
      this.attributes,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending paywall audit in status draft. */
export function newPendingPaywallAudit(code: string, label: string): PendingPaywallAudit {
  return new PendingPaywallAudit(code, label, 0, "", 0, 0, new Map<string, string>(), 0, "draft");
}
