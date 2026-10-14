import * as text from "../../../../kit/text.js";

/** Where a adaptive exit rule snapshot is in its life cycle. */
export type AdaptiveExitRuleSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive exit rule snapshot. Its code is unique within a tenant. */
export class AdaptiveExitRuleSnapshot {
  code: string;
  label: string;
  contactEmail: string;
  country: string;
  source: string;
  audienceId: string;
  description: string;
  margin: number;
  status: AdaptiveExitRuleSnapshotStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    country: string,
    source: string,
    audienceId: string,
    description: string,
    margin: number,
    status: AdaptiveExitRuleSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.country = country;
    this.source = source;
    this.audienceId = audienceId;
    this.description = description;
    this.margin = margin;
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

  canMoveTo(next: AdaptiveExitRuleSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveExitRuleSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive exit rule snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): AdaptiveExitRuleSnapshot {
    return new AdaptiveExitRuleSnapshot(
      this.code,
      this.label,
      this.contactEmail,
      this.country,
      this.source,
      this.audienceId,
      this.description,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive exit rule snapshot in status draft. */
export function newAdaptiveExitRuleSnapshot(code: string, label: string): AdaptiveExitRuleSnapshot {
  return new AdaptiveExitRuleSnapshot(code, label, "", "", "", "", "", 0, "draft");
}
