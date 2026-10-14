import * as text from "../../../../kit/text.js";

/** Where a pending reply audit is in its life cycle. */
export type PendingReplyAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending reply audit as the reply team keeps it. */
export class PendingReplyAudit {
  code: string;
  name: string;
  notes: string;
  source: string;
  channel: string;
  attributes: Map<string, string>;
  score: number;
  status: PendingReplyAuditStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    source: string,
    channel: string,
    attributes: Map<string, string>,
    score: number,
    status: PendingReplyAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.source = source;
    this.channel = channel;
    this.attributes = attributes;
    this.score = score;
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

  canMoveTo(next: PendingReplyAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingReplyAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reply audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending reply audit"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PendingReplyAudit {
    return new PendingReplyAudit(
      this.code,
      this.name,
      this.notes,
      this.source,
      this.channel,
      this.attributes,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending reply audit in status draft. */
export function newPendingReplyAudit(code: string, name: string): PendingReplyAudit {
  return new PendingReplyAudit(code, name, "", "", "", new Map<string, string>(), 0, "draft");
}
