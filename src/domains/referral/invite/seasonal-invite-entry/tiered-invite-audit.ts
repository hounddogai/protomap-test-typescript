import * as text from "../../../../kit/text.js";

/** Where a tiered invite audit is in its life cycle. */
export type TieredInviteAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered invite audit as the invite team keeps it. */
export class TieredInviteAudit {
  code: string;
  title: string;
  discount: number;
  attributes: Map<string, string>;
  updatedAt: number;
  sendAt: number;
  label: string;
  priority: number;
  status: TieredInviteAuditStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    attributes: Map<string, string>,
    updatedAt: number,
    sendAt: number,
    label: string,
    priority: number,
    status: TieredInviteAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.label = label;
    this.priority = priority;
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

  canMoveTo(next: TieredInviteAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredInviteAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered invite audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.sendAt - this.updatedAt) * 100) / 100;
  }

  copy(): TieredInviteAudit {
    return new TieredInviteAudit(
      this.code,
      this.title,
      this.discount,
      this.attributes,
      this.updatedAt,
      this.sendAt,
      this.label,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered invite audit in status planned. */
export function newTieredInviteAudit(code: string, title: string): TieredInviteAudit {
  return new TieredInviteAudit(code, title, 0, new Map<string, string>(), 0, 0, "", 0, "planned");
}
