import * as text from "../../../../kit/text.js";

/** Where a mention mapping is in its life cycle. */
export type MentionMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A mention mapping. Its code is unique within a tenant. */
export class MentionMapping {
  code: string;
  name: string;
  utmSource: string;
  phone: string;
  variant: string;
  expiresAt: number;
  status: MentionMappingStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    phone: string,
    variant: string,
    expiresAt: number,
    status: MentionMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.phone = phone;
    this.variant = variant;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: MentionMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: MentionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): MentionMapping {
    return new MentionMapping(
      this.code,
      this.name,
      this.utmSource,
      this.phone,
      this.variant,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a mention mapping in status planned. */
export function newMentionMapping(code: string, name: string): MentionMapping {
  return new MentionMapping(code, name, "", "", "", 0, "planned");
}
