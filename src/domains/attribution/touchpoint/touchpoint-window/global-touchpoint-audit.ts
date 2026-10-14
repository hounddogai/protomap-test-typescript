import * as text from "../../../../kit/text.js";

/** Where a global touchpoint audit is in its life cycle. */
export type GlobalTouchpointAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A global touchpoint audit as the touchpoint team keeps it. */
export class GlobalTouchpointAudit {
  code: string;
  name: string;
  journeyId: string;
  cost: number;
  budget: number;
  startsAt: number;
  externalRef: string;
  attributes: Map<string, string>;
  source: string;
  rate: number;
  phone: string;
  status: GlobalTouchpointAuditStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    cost: number,
    budget: number,
    startsAt: number,
    externalRef: string,
    attributes: Map<string, string>,
    source: string,
    rate: number,
    phone: string,
    status: GlobalTouchpointAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.cost = cost;
    this.budget = budget;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.attributes = attributes;
    this.source = source;
    this.rate = rate;
    this.phone = phone;
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

  canMoveTo(next: GlobalTouchpointAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalTouchpointAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global touchpoint audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round((this.budget - this.cost) * 100) / 100;
  }

  copy(): GlobalTouchpointAudit {
    return new GlobalTouchpointAudit(
      this.code,
      this.name,
      this.journeyId,
      this.cost,
      this.budget,
      this.startsAt,
      this.externalRef,
      this.attributes,
      this.source,
      this.rate,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global touchpoint audit in status requested. */
export function newGlobalTouchpointAudit(code: string, name: string): GlobalTouchpointAudit {
  return new GlobalTouchpointAudit(code, name, "", 0, 0, 0, "", new Map<string, string>(), "", 0, "", "requested");
}
