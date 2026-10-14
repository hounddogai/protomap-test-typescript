import * as text from "../../../../kit/text.js";

/** Where a default post audit is in its life cycle. */
export type DefaultPostAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default post audit as the post team keeps it. */
export class DefaultPostAudit {
  code: string;
  name: string;
  segment: string;
  externalRef: string;
  phone: string;
  frequencyCap: number;
  category: string;
  tags: string[];
  audienceId: string;
  contactEmail: string;
  status: DefaultPostAuditStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    externalRef: string,
    phone: string,
    frequencyCap: number,
    category: string,
    tags: string[],
    audienceId: string,
    contactEmail: string,
    status: DefaultPostAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.externalRef = externalRef;
    this.phone = phone;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.tags = tags;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: DefaultPostAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPostAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default post audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default post audit"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): DefaultPostAudit {
    return new DefaultPostAudit(
      this.code,
      this.name,
      this.segment,
      this.externalRef,
      this.phone,
      this.frequencyCap,
      this.category,
      this.tags,
      this.audienceId,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default post audit in status planned. */
export function newDefaultPostAudit(code: string, name: string): DefaultPostAudit {
  return new DefaultPostAudit(code, name, "", "", "", 0, "", [], "", "", "planned");
}
