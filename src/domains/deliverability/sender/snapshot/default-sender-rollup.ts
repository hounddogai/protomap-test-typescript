import * as text from "../../../../kit/text.js";

/** Where a default sender rollup is in its life cycle. */
export type DefaultSenderRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a default sender rollup and its current status. */
export class DefaultSenderRollup {
  code: string;
  label: string;
  audienceId: string;
  sendAt: number;
  windowDays: number;
  frequencyCap: number;
  campaignRef: string;
  version: number;
  externalRef: string;
  approved: boolean;
  status: DefaultSenderRollupStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    sendAt: number,
    windowDays: number,
    frequencyCap: number,
    campaignRef: string,
    version: number,
    externalRef: string,
    approved: boolean,
    status: DefaultSenderRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
    this.campaignRef = campaignRef;
    this.version = version;
    this.externalRef = externalRef;
    this.approved = approved;
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

  canMoveTo(next: DefaultSenderRollupStatus): boolean {
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

  moveTo(next: DefaultSenderRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sender rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round((this.frequencyCap + this.sendAt) * 100) / 100;
  }

  copy(): DefaultSenderRollup {
    return new DefaultSenderRollup(
      this.code,
      this.label,
      this.audienceId,
      this.sendAt,
      this.windowDays,
      this.frequencyCap,
      this.campaignRef,
      this.version,
      this.externalRef,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default sender rollup in status requested. */
export function newDefaultSenderRollup(code: string, label: string): DefaultSenderRollup {
  return new DefaultSenderRollup(code, label, "", 0, 0, 0, "", 0, "", false, "requested");
}
