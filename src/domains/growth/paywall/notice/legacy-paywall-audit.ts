import * as text from "../../../../kit/text.js";

/** Where a legacy paywall audit is in its life cycle. */
export type LegacyPaywallAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a legacy paywall audit and its current status. */
export class LegacyPaywallAudit {
  code: string;
  title: string;
  version: number;
  summary: string;
  priority: number;
  category: string;
  endsAt: number;
  source: string;
  status: LegacyPaywallAuditStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    summary: string,
    priority: number,
    category: string,
    endsAt: number,
    source: string,
    status: LegacyPaywallAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.summary = summary;
    this.priority = priority;
    this.category = category;
    this.endsAt = endsAt;
    this.source = source;
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

  canMoveTo(next: LegacyPaywallAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LegacyPaywallAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy paywall audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"legacy paywall audit"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.endsAt + this.version) * 100) / 100;
  }

  copy(): LegacyPaywallAudit {
    return new LegacyPaywallAudit(
      this.code,
      this.title,
      this.version,
      this.summary,
      this.priority,
      this.category,
      this.endsAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy paywall audit in status planned. */
export function newLegacyPaywallAudit(code: string, title: string): LegacyPaywallAudit {
  return new LegacyPaywallAudit(code, title, 0, "", 0, "", 0, "", "planned");
}
