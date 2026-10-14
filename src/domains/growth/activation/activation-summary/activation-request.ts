import * as text from "../../../../kit/text.js";

/** Where a activation request is in its life cycle. */
export type ActivationRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** One activation request, with what the planners need to act on it. */
export class ActivationRequest {
  code: string;
  title: string;
  budget: number;
  expiresAt: number;
  openRate: number;
  revision: number;
  contactEmail: string;
  externalRef: string;
  channel: string;
  variant: string;
  status: ActivationRequestStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    expiresAt: number,
    openRate: number,
    revision: number,
    contactEmail: string,
    externalRef: string,
    channel: string,
    variant: string,
    status: ActivationRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.openRate = openRate;
    this.revision = revision;
    this.contactEmail = contactEmail;
    this.externalRef = externalRef;
    this.channel = channel;
    this.variant = variant;
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

  canMoveTo(next: ActivationRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ActivationRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.openRate * this.budget * 100) / 100;
  }

  copy(): ActivationRequest {
    return new ActivationRequest(
      this.code,
      this.title,
      this.budget,
      this.expiresAt,
      this.openRate,
      this.revision,
      this.contactEmail,
      this.externalRef,
      this.channel,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a activation request in status requested. */
export function newActivationRequest(code: string, title: string): ActivationRequest {
  return new ActivationRequest(code, title, 0, 0, 0, 0, "", "", "", "", "requested");
}
