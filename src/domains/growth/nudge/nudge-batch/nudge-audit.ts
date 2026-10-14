import * as text from "../../../../kit/text.js";

/** Where a nudge audit is in its life cycle. */
export type NudgeAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A nudge audit. Its code is unique within a tenant. */
export class NudgeAudit {
  code: string;
  name: string;
  locale: string;
  unit: string;
  sendAt: number;
  attributes: Map<string, string>;
  sequence: number;
  label: string;
  phone: string;
  updatedAt: number;
  status: NudgeAuditStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    unit: string,
    sendAt: number,
    attributes: Map<string, string>,
    sequence: number,
    label: string,
    phone: string,
    updatedAt: number,
    status: NudgeAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.unit = unit;
    this.sendAt = sendAt;
    this.attributes = attributes;
    this.sequence = sequence;
    this.label = label;
    this.phone = phone;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round((this.sequence - this.updatedAt) * 100) / 100;
  }

  copy(): NudgeAudit {
    return new NudgeAudit(
      this.code,
      this.name,
      this.locale,
      this.unit,
      this.sendAt,
      this.attributes,
      this.sequence,
      this.label,
      this.phone,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge audit in status requested. */
export function newNudgeAudit(code: string, name: string): NudgeAudit {
  return new NudgeAudit(code, name, "", "", 0, new Map<string, string>(), 0, "", "", 0, "requested");
}
