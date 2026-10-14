import * as text from "../../../../kit/text.js";

/** Where a primary paywall template is in its life cycle. */
export type PrimaryPaywallTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary paywall template and its current status. */
export class PrimaryPaywallTemplate {
  code: string;
  name: string;
  revision: number;
  journeyId: string;
  region: string;
  expiresAt: number;
  createdAt: number;
  source: string;
  status: PrimaryPaywallTemplateStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    journeyId: string,
    region: string,
    expiresAt: number,
    createdAt: number,
    source: string,
    status: PrimaryPaywallTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.journeyId = journeyId;
    this.region = region;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.source = source;
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

  canMoveTo(next: PrimaryPaywallTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: PrimaryPaywallTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary paywall template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"primary paywall template"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt + this.revision) * 100) / 100;
  }

  copy(): PrimaryPaywallTemplate {
    return new PrimaryPaywallTemplate(
      this.code,
      this.name,
      this.revision,
      this.journeyId,
      this.region,
      this.expiresAt,
      this.createdAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary paywall template in status requested. */
export function newPrimaryPaywallTemplate(code: string, name: string): PrimaryPaywallTemplate {
  return new PrimaryPaywallTemplate(code, name, 0, "", "", 0, 0, "", "requested");
}
