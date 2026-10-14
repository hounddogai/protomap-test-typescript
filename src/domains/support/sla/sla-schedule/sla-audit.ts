import * as text from "../../../../kit/text.js";

/** Where a sla audit is in its life cycle. */
export type SlaAuditStatus = "created" | "validated" | "published" | "retired";

/** The record of a sla audit and its current status. */
export class SlaAudit {
  code: string;
  title: string;
  expiresAt: number;
  phone: string;
  channel: string;
  active: boolean;
  description: string;
  status: SlaAuditStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    phone: string,
    channel: string,
    active: boolean,
    description: string,
    status: SlaAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.phone = phone;
    this.channel = channel;
    this.active = active;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaAuditStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"sla audit"} ${this.code}`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): SlaAudit {
    return new SlaAudit(
      this.code,
      this.title,
      this.expiresAt,
      this.phone,
      this.channel,
      this.active,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sla audit in status created. */
export function newSlaAudit(code: string, title: string): SlaAudit {
  return new SlaAudit(code, title, 0, "", "", false, "", "created");
}
