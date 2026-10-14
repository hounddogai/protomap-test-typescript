import * as text from "../../../../kit/text.js";

/** Where a lenient sla notice is in its life cycle. */
export type LenientSlaNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One lenient sla notice, with what the planners need to act on it. */
export class LenientSlaNotice {
  code: string;
  name: string;
  notes: string;
  phone: string;
  tags: string[];
  audienceId: string;
  updatedAt: number;
  status: LenientSlaNoticeStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    phone: string,
    tags: string[],
    audienceId: string,
    updatedAt: number,
    status: LenientSlaNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.phone = phone;
    this.tags = tags;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: LenientSlaNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientSlaNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sla notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient sla notice"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): LenientSlaNotice {
    return new LenientSlaNotice(
      this.code,
      this.name,
      this.notes,
      this.phone,
      this.tags,
      this.audienceId,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient sla notice in status open. */
export function newLenientSlaNotice(code: string, name: string): LenientSlaNotice {
  return new LenientSlaNotice(code, name, "", "", [], "", 0, "open");
}
