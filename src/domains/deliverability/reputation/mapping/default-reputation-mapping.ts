/**
 * The default reputation mapping records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default reputation mapping is in its life cycle. */
export type DefaultReputationMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One default reputation mapping, with what the planners need to act on it. */
export class DefaultReputationMapping {
  code: string;
  label: string;
  currency: string;
  contactEmail: string;
  channel: string;
  archived: boolean;
  weight: number;
  status: DefaultReputationMappingStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    contactEmail: string,
    channel: string,
    archived: boolean,
    weight: number,
    status: DefaultReputationMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.archived = archived;
    this.weight = weight;
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

  canMoveTo(next: DefaultReputationMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultReputationMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default reputation mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): DefaultReputationMapping {
    return new DefaultReputationMapping(
      this.code,
      this.label,
      this.currency,
      this.contactEmail,
      this.channel,
      this.archived,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default reputation mapping in status draft. */
export function newDefaultReputationMapping(code: string, label: string): DefaultReputationMapping {
  return new DefaultReputationMapping(code, label, "", "", "", false, 0, "draft");
}
