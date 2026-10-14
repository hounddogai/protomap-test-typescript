import * as text from "../../../../kit/text.js";

/** Where a manual touchpoint assignment is in its life cycle. */
export type ManualTouchpointAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual touchpoint assignment as the touchpoint team keeps it. */
export class ManualTouchpointAssignment {
  code: string;
  name: string;
  summary: string;
  campaignRef: string;
  locale: string;
  retries: number;
  label: string;
  status: ManualTouchpointAssignmentStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    campaignRef: string,
    locale: string,
    retries: number,
    label: string,
    status: ManualTouchpointAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.retries = retries;
    this.label = label;
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

  canMoveTo(next: ManualTouchpointAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualTouchpointAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual touchpoint assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): ManualTouchpointAssignment {
    return new ManualTouchpointAssignment(
      this.code,
      this.name,
      this.summary,
      this.campaignRef,
      this.locale,
      this.retries,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual touchpoint assignment in status requested. */
export function newManualTouchpointAssignment(code: string, name: string): ManualTouchpointAssignment {
  return new ManualTouchpointAssignment(code, name, "", "", "", 0, "", "requested");
}
