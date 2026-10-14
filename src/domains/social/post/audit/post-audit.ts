/**
 * The post audit records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post audit is in its life cycle. */
export type PostAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A post audit as the post team keeps it. */
export class PostAudit {
  code: string;
  name: string;
  weight: number;
  checksum: string;
  phone: string;
  maximum: number;
  cohort: string;
  status: PostAuditStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    checksum: string,
    phone: string,
    maximum: number,
    cohort: string,
    status: PostAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.checksum = checksum;
    this.phone = phone;
    this.maximum = maximum;
    this.cohort = cohort;
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

  canMoveTo(next: PostAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PostAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.weight * this.maximum * 100) / 100;
  }

  copy(): PostAudit {
    return new PostAudit(
      this.code,
      this.name,
      this.weight,
      this.checksum,
      this.phone,
      this.maximum,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a post audit in status idle. */
export function newPostAudit(code: string, name: string): PostAudit {
  return new PostAudit(code, name, 0, "", "", 0, "", "idle");
}
