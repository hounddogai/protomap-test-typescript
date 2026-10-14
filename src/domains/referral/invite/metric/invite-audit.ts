import * as text from "../../../../kit/text.js";

/** Where a invite audit is in its life cycle. */
export type InviteAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A invite audit. Its code is unique within a tenant. */
export class InviteAudit {
  code: string;
  title: string;
  segment: string;
  label: string;
  tags: string[];
  floorValue: number;
  name: string;
  campaignRef: string;
  frequencyCap: number;
  graceDays: number;
  status: InviteAuditStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    label: string,
    tags: string[],
    floorValue: number,
    name: string,
    campaignRef: string,
    frequencyCap: number,
    graceDays: number,
    status: InviteAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.label = label;
    this.tags = tags;
    this.floorValue = floorValue;
    this.name = name;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: InviteAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"invite audit"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.frequencyCap * this.graceDays * 100) / 100;
  }

  copy(): InviteAudit {
    return new InviteAudit(
      this.code,
      this.title,
      this.segment,
      this.label,
      this.tags,
      this.floorValue,
      this.name,
      this.campaignRef,
      this.frequencyCap,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a invite audit in status open. */
export function newInviteAudit(code: string, title: string): InviteAudit {
  return new InviteAudit(code, title, "", "", [], 0, "", "", 0, 0, "open");
}
