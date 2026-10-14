import * as text from "../../../../kit/text.js";

/** Where a scheduled domain request is in its life cycle. */
export type ScheduledDomainRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a scheduled domain request and its current status. */
export class ScheduledDomainRequest {
  code: string;
  name: string;
  attributes: Map<string, string>;
  source: string;
  visible: boolean;
  reviewer: string;
  quantity: number;
  status: ScheduledDomainRequestStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    source: string,
    visible: boolean,
    reviewer: string,
    quantity: number,
    status: ScheduledDomainRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.source = source;
    this.visible = visible;
    this.reviewer = reviewer;
    this.quantity = quantity;
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

  canMoveTo(next: ScheduledDomainRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledDomainRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled domain request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ScheduledDomainRequest {
    return new ScheduledDomainRequest(
      this.code,
      this.name,
      this.attributes,
      this.source,
      this.visible,
      this.reviewer,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled domain request in status requested. */
export function newScheduledDomainRequest(code: string, name: string): ScheduledDomainRequest {
  return new ScheduledDomainRequest(code, name, new Map<string, string>(), "", false, "", 0, "requested");
}
