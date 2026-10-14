/**
 * The domain manifest records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain manifest is in its life cycle. */
export type DomainManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A domain manifest. Its code is unique within a tenant. */
export class DomainManifest {
  code: string;
  name: string;
  graceDays: number;
  reviewer: string;
  budget: number;
  maximum: number;
  campaignRef: string;
  status: DomainManifestStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    reviewer: string,
    budget: number,
    maximum: number,
    campaignRef: string,
    status: DomainManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.budget = budget;
    this.maximum = maximum;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: DomainManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
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

  moveTo(next: DomainManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"domain manifest"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.maximum + this.budget) * 100) / 100;
  }

  copy(): DomainManifest {
    return new DomainManifest(
      this.code,
      this.name,
      this.graceDays,
      this.reviewer,
      this.budget,
      this.maximum,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a domain manifest in status planned. */
export function newDomainManifest(code: string, name: string): DomainManifest {
  return new DomainManifest(code, name, 0, "", 0, 0, "", "planned");
}
