/**
 * The adaptive funnel agreement records of growth's funnel work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive funnel agreement is in its life cycle. */
export type AdaptiveFunnelAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive funnel agreement. Its code is unique within a tenant. */
export class AdaptiveFunnelAgreement {
  code: string;
  label: string;
  frequencyCap: number;
  locale: string;
  audienceId: string;
  pinned: boolean;
  archived: boolean;
  channel: string;
  revision: number;
  status: AdaptiveFunnelAgreementStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    locale: string,
    audienceId: string,
    pinned: boolean,
    archived: boolean,
    channel: string,
    revision: number,
    status: AdaptiveFunnelAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
    this.audienceId = audienceId;
    this.pinned = pinned;
    this.archived = archived;
    this.channel = channel;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveFunnelAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveFunnelAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive funnel agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.revision * this.frequencyCap * 100) / 100;
  }

  copy(): AdaptiveFunnelAgreement {
    return new AdaptiveFunnelAgreement(
      this.code,
      this.label,
      this.frequencyCap,
      this.locale,
      this.audienceId,
      this.pinned,
      this.archived,
      this.channel,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive funnel agreement in status idle. */
export function newAdaptiveFunnelAgreement(code: string, label: string): AdaptiveFunnelAgreement {
  return new AdaptiveFunnelAgreement(code, label, 0, "", "", false, false, "", 0, "idle");
}
