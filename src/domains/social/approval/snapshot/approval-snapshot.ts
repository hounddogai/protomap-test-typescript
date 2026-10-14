/**
 * The approval snapshot records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval snapshot is in its life cycle. */
export type ApprovalSnapshotStatus = "created" | "validated" | "published" | "retired";

/** A approval snapshot. Its code is unique within a tenant. */
export class ApprovalSnapshot {
  code: string;
  name: string;
  timezone: string;
  attributes: Map<string, string>;
  tags: string[];
  phone: string;
  sendAt: number;
  status: ApprovalSnapshotStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    attributes: Map<string, string>,
    tags: string[],
    phone: string,
    sendAt: number,
    status: ApprovalSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.attributes = attributes;
    this.tags = tags;
    this.phone = phone;
    this.sendAt = sendAt;
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

  canMoveTo(next: ApprovalSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): ApprovalSnapshot {
    return new ApprovalSnapshot(
      this.code,
      this.name,
      this.timezone,
      this.attributes,
      this.tags,
      this.phone,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval snapshot in status created. */
export function newApprovalSnapshot(code: string, name: string): ApprovalSnapshot {
  return new ApprovalSnapshot(code, name, "", new Map<string, string>(), [], "", 0, "created");
}
