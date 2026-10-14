import * as text from "../../../../kit/text.js";

/** Where a regional proof profile is in its life cycle. */
export type RegionalProofProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One regional proof profile, with what the planners need to act on it. */
export class RegionalProofProfile {
  code: string;
  name: string;
  tags: string[];
  visible: boolean;
  channel: string;
  version: number;
  discount: number;
  campaignRef: string;
  frequencyCap: number;
  maximum: number;
  contactEmail: string;
  status: RegionalProofProfileStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    visible: boolean,
    channel: string,
    version: number,
    discount: number,
    campaignRef: string,
    frequencyCap: number,
    maximum: number,
    contactEmail: string,
    status: RegionalProofProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.visible = visible;
    this.channel = channel;
    this.version = version;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
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

  canMoveTo(next: RegionalProofProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalProofProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional proof profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.maximum - this.version) * 100) / 100;
  }

  copy(): RegionalProofProfile {
    return new RegionalProofProfile(
      this.code,
      this.name,
      this.tags,
      this.visible,
      this.channel,
      this.version,
      this.discount,
      this.campaignRef,
      this.frequencyCap,
      this.maximum,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional proof profile in status planned. */
export function newRegionalProofProfile(code: string, name: string): RegionalProofProfile {
  return new RegionalProofProfile(code, name, [], false, "", 0, 0, "", 0, 0, "", "planned");
}
